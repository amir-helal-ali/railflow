// Docker integration via bollard (Rust Docker SDK).
// Real connection to /var/run/docker.sock — list/build/pull/run/stop containers,
// stream stats and events in real time.

use bollard::{
    container::{ListContainersOptions, StatsOptions, StopContainerOptions},
    models::{ContainerCreateBody, ContainerSummary},
    system::EventsOptions,
    Docker,
};
use futures_core::Stream;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::mpsc;

use crate::error::AppError;

#[derive(Clone)]
pub struct DockerService {
    client: Docker,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContainerInfo {
    pub id: String,
    pub name: String,
    pub image: String,
    pub status: String,
    pub state: String,
    pub command: String,
    pub created: i64,
    pub ports: Vec<PortMapping>,
    pub labels: HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PortMapping {
    pub host: Option<u16>,
    pub container: u16,
    pub protocol: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContainerStats {
    pub cpu_percent: f64,
    pub memory_used_mb: f64,
    pub memory_limit_mb: f64,
    pub net_in_mb: f64,
    pub net_out_mb: f64,
    pub block_read_mb: f64,
    pub block_write_mb: f64,
    pub pids: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DockerEvent {
    pub id: String,
    pub r#type: String,
    pub action: String,
    pub actor_id: String,
    pub time: chrono::DateTime<chrono::Utc>,
    pub message: String,
}

impl DockerService {
    pub async fn new(socket: &str) -> Result<Self, AppError> {
        let client = if socket.starts_with("tcp://") || socket.starts_with("http://") {
            Docker::connect_with_http_defaults()?
        } else {
            Docker::connect_with_unix_defaults()?
        };

        // Verify connection
        let version = client.version().await.map_err(|e| {
            AppError::Internal(format!("Failed to connect to Docker daemon: {e}"))
        })?;
        tracing::info!("Docker {} connected", version.version.unwrap_or_default());

        Ok(Self { client })
    }

    /// Borrow the underlying Docker client for advanced operations
    /// (volumes, networks, etc.) not exposed by this wrapper.
    pub fn client(&self) -> &Docker {
        &self.client
    }

    /// List all containers (running + stopped by default).
    pub async fn list_containers(&self, all: bool) -> Result<Vec<ContainerInfo>, AppError> {
        let options = ListContainersOptions::<String> {
            all,
            ..Default::default()
        };

        let containers = self.client.list_containers(Some(options)).await?;

        Ok(containers
            .into_iter()
            .filter_map(|c| self.map_container_summary(c))
            .collect())
    }

    /// Get a specific container's info.
    pub async fn inspect_container(&self, id: &str) -> Result<ContainerInfo, AppError> {
        let inspect = self.client.inspect_container(id, None).await?;

        Ok(ContainerInfo {
            id: inspect.id.unwrap_or_default(),
            name: inspect.name.unwrap_or_default().trim_start_matches('/').to_string(),
            image: inspect.image.unwrap_or_default(),
            status: inspect.state.as_ref().and_then(|s| s.status.clone()).unwrap_or_default().into(),
            state: inspect.state.as_ref().and_then(|s| s.status.clone()).unwrap_or_default().into(),
            command: inspect.config.as_ref().and_then(|c| c.cmd.clone()).unwrap_or_default().join(" "),
            created: inspect.created.as_ref().and_then(|c| chrono::DateTime::parse_from_rfc3339(c).ok()).map(|d| d.timestamp()).unwrap_or(0),
            ports: Vec::new(), // populated from inspect.Config.ExposedPorts if needed
            labels: inspect.config.as_ref().and_then(|c| c.labels.clone()).unwrap_or_default(),
        })
    }

    /// Start a container.
    pub async fn start_container(&self, id: &str) -> Result<(), AppError> {
        self.client.start_container(id, None).await?;
        Ok(())
    }

    /// Stop a container (graceful with timeout).
    pub async fn stop_container(&self, id: &str, timeout_secs: i32) -> Result<(), AppError> {
        self.client
            .stop_container(id, Some(StopContainerOptions { t: timeout_secs }))
            .await?;
        Ok(())
    }

    /// Restart a container.
    pub async fn restart_container(&self, id: &str, timeout_secs: i32) -> Result<(), AppError> {
        self.client
            .restart_container(id, Some(StopContainerOptions { t: timeout_secs }))
            .await?;
        Ok(())
    }

    /// Remove a container (force + remove volumes).
    pub async fn remove_container(&self, id: &str, force: bool) -> Result<(), AppError> {
        self.client
            .remove_container(
                id,
                Some(bollard::container::RemoveContainerOptions {
                    force,
                    link: false,
                    volumes: true,
                }),
            )
            .await?;
        Ok(())
    }

    /// Create & start a container from a project's image.
    pub async fn create_container(
        &self,
        name: &str,
        image: &str,
        env: Vec<String>,
        ports: HashMap<u16, u16>,
        labels: HashMap<String, String>,
    ) -> Result<String, AppError> {
        let mut exposed_ports = HashMap::new();
        let mut port_bindings = HashMap::new();
        for (host, container) in ports {
            exposed_ports.insert(format!("{container}/tcp"), HashMap::new());
            port_bindings.insert(
                format!("{container}/tcp"),
                Some(vec![bollard::models::PortBinding {
                    host_ip: Some("0.0.0.0".into()),
                    host_port: Some(host.to_string()),
                }]),
            );
        }

        let config = ContainerCreateBody {
            image: Some(image.to_string()),
            name: Some(name.to_string()),
            env: Some(env),
            exposed_ports: Some(exposed_ports),
            host_config: Some(bollard::models::HostConfig {
                port_bindings: Some(port_bindings),
                restart_policy: Some(bollard::models::RestartPolicy {
                    name: Some(bollard::models::RestartPolicyNameEnum::UNLESS_STOPPED),
                    maximum_retry_count: None,
                }),
                ..Default::default()
            }),
            labels: Some(labels),
            ..Default::default()
        };

        let created = self.client.create_container(Some(config.clone()), config).await
            .map_err(|e| AppError::Docker(format!("Failed to create container: {e}")))?;
        self.client.start_container(&created.id, None).await
            .map_err(|e| AppError::Docker(format!("Failed to start container: {e}")))?;
        Ok(created.id)
    }

    /// Live stats stream — pushes ContainerStats to channel at 1Hz.
    pub fn stats_stream(&self, container_id: String) -> mpsc::Receiver<Result<ContainerStats, AppError>> {
        let (tx, rx) = mpsc::channel(32);
        let client = self.client.clone();

        tokio::spawn(async move {
            let options = StatsOptions { stream: true, one_shot: false };
            let mut stream = client.stats(&container_id, Some(options));

            while let Some(Ok(stats)) = stream.next().await {
                let parsed = parse_stats(&stats);
                if tx.send(Ok(parsed)).await.is_err() {
                    break;
                }
            }
        });

        rx
    }

    /// Live event stream — pushes DockerEvent to channel.
    pub fn events_stream(&self) -> mpsc::Receiver<Result<DockerEvent, AppError>> {
        let (tx, rx) = mpsc::channel(64);
        let client = self.client.clone();

        tokio::spawn(async move {
            let options = EventsOptions::<String> {
                since: None,
                until: None,
                filters: HashMap::new(),
            };
            let mut stream = client.events(Some(options));

            while let Some(Ok(event)) = stream.next().await {
                let action_str = event.action.clone().unwrap_or_default();
                let actor_name = event.actor.as_ref()
                    .and_then(|a| a.attributes.as_ref())
                    .and_then(|attrs| attrs.get("name"))
                    .cloned()
                    .unwrap_or_default();
                let parsed = DockerEvent {
                    id: uuid::Uuid::new_v4().to_string(),
                    r#type: event.typ.unwrap_or_default(),
                    action: action_str.clone(),
                    actor_id: event.actor.and_then(|a| a.id).unwrap_or_default(),
                    time: chrono::DateTime::from_timestamp(event.time.unwrap_or(0), 0).unwrap_or_else(|| chrono::Utc::now()),
                    message: format!("{action_str} on {actor_name}"),
                };
                if tx.send(Ok(parsed)).await.is_err() {
                    break;
                }
            }
        });

        rx
    }

    /// Stream container logs (tail).
    pub async fn logs_stream(
        &self,
        container_id: &str,
        tail: u64,
    ) -> Result<impl Stream<Item = Result<String, AppError>> + Send, AppError> {
        let options = bollard::container::LogsOptions::<String> {
            stdout: true,
            stderr: true,
            follow: true,
            tail: tail.to_string(),
            timestamps: true,
            ..Default::default()
        };

        let stream = self.client.logs(container_id, Some(options));
        Ok(stream.filter_map(|item| async move {
            match item {
                Ok(bollard::container::LogOutput::StdOut { message }) => Some(Ok(String::from_utf8_lossy(&message).to_string())),
                Ok(bollard::container::LogOutput::StdErr { message }) => Some(Ok(String::from_utf8_lossy(&message).to_string())),
                Ok(_) => None,
                Err(e) => Some(Err(AppError::Internal(format!("Log stream error: {e}")))),
            }
        }))
    }

    fn map_container_summary(&self, c: ContainerSummary) -> Option<ContainerInfo> {
        Some(ContainerInfo {
            id: c.id?,
            name: c.names?.into_iter().next()?.trim_start_matches('/').to_string(),
            image: c.image.unwrap_or_default(),
            status: c.status.unwrap_or_default(),
            state: c.state.unwrap_or_default(),
            command: c.command.unwrap_or_default(),
            created: c.created.unwrap_or(0),
            ports: c.ports.unwrap_or_default().into_iter().filter_map(|p| Some(PortMapping {
                host: p.public_port,
                container: p.private_port?,
                protocol: p.typ.unwrap_or_default(),
            })).collect(),
            labels: c.labels.unwrap_or_default(),
        })
    }
}

fn parse_stats(stats: &bollard::container::Stats) -> ContainerStats {
    let cpu_delta = (stats.cpu_stats.cpu_usage.total_usage.unwrap_or(0) as f64)
        - (stats.precpu_stats.cpu_usage.total_usage.unwrap_or(0) as f64);
    let system_delta = (stats.cpu_stats.system_cpu_usage.unwrap_or(0) as f64)
        - (stats.precpu_stats.system_cpu_usage.unwrap_or(0) as f64);
    let cpu_percent = if system_delta > 0.0 && cpu_delta > 0.0 {
        (cpu_delta / system_delta) * 100.0
            * stats.cpu_stats.online_cpus.unwrap_or(1) as f64
    } else {
        0.0
    };

    let memory_used = stats.memory_stats.usage.unwrap_or(0) as f64
        - stats.memory_stats.stats.as_ref()
            .and_then(|s| s.get("cache"))
            .and_then(|c| c.as_u64())
            .unwrap_or(0) as f64;
    let memory_limit = stats.memory_stats.limit.unwrap_or(0) as f64;

    let (net_in, net_out) = stats
        .networks
        .as_ref()
        .map(|n| {
            n.values().fold((0u64, 0u64), |(i, o), v| {
                (i + v.rx_bytes.unwrap_or(0), o + v.tx_bytes.unwrap_or(0))
            })
        })
        .unwrap_or((0, 0));

    let (block_read, block_write) = stats
        .blkio_stats
        .io_service_bytes_recursive
        .as_ref()
        .map(|v| {
            v.iter().fold((0u64, 0u64), |(r, w), b| {
                match b.op.as_deref() {
                    Some("read") => (r + b.value.unwrap_or(0), w),
                    Some("write") => (r, w + b.value.unwrap_or(0)),
                    _ => (r, w),
                }
            })
        })
        .unwrap_or((0, 0));

    ContainerStats {
        cpu_percent,
        memory_used_mb: memory_used / 1024.0 / 1024.0,
        memory_limit_mb: memory_limit / 1024.0 / 1024.0,
        net_in_mb: net_in as f64 / 1024.0 / 1024.0,
        net_out_mb: net_out as f64 / 1024.0 / 1024.0,
        block_read_mb: block_read as f64 / 1024.0 / 1024.0,
        block_write_mb: block_write as f64 / 1024.0 / 1024.0,
        pids: stats.pids_stats.current.unwrap_or(0),
    }
}
