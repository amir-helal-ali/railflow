// Server / host metrics via sysinfo crate.
// Provides CPU, memory, disk, network, and process information.

use serde::{Deserialize, Serialize};
use sysinfo::{Disk, Disks, Networks, RefreshKind, System};

#[derive(Clone)]
pub struct ServerService {
    // We rebuild on each call rather than holding a System in state
    // to avoid Send issues with sysinfo. The cost is negligible.
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServerInfo {
    pub hostname: String,
    pub os: String,
    pub kernel: String,
    pub uptime: u64,
    pub boot_time: chrono::DateTime<chrono::Utc>,
    pub cpu: CpuInfo,
    pub memory: MemoryInfo,
    pub disk: DiskInfo,
    pub network: NetworkInfo,
    pub docker: DockerSummary,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CpuInfo {
    pub model: String,
    pub cores: usize,
    pub physical_cores: usize,
    pub frequency_mhz: u64,
    pub load_avg1: f64,
    pub load_avg5: f64,
    pub load_avg15: f64,
    pub per_core_usage: Vec<f64>,
    pub overall_usage: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MemoryInfo {
    pub total_gb: f64,
    pub used_gb: f64,
    pub available_gb: f64,
    pub cached_gb: f64,
    pub swap_total_gb: f64,
    pub swap_used_gb: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiskInfo {
    pub total_gb: f64,
    pub used_gb: f64,
    pub available_gb: f64,
    pub partitions: Vec<PartitionInfo>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PartitionInfo {
    pub device: String,
    pub mount: String,
    pub fs_type: String,
    pub total_gb: f64,
    pub used_gb: f64,
    pub used_percent: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkInfo {
    pub interfaces: Vec<NetworkInterface>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkInterface {
    pub name: String,
    pub ip: String,
    pub mac: String,
    pub inbound_mbps: f64,
    pub outbound_mbps: f64,
    pub total_in_gb: f64,
    pub total_out_gb: f64,
    pub is_up: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DockerSummary {
    pub version: String,
    pub containers_total: usize,
    pub containers_running: usize,
    pub containers_stopped: usize,
    pub images: usize,
    pub storage_driver: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub user: String,
    pub cpu_percent: f64,
    pub memory_mb: f64,
    pub memory_percent: f64,
    pub status: String,
    pub start_time: chrono::DateTime<chrono::Utc>,
    pub command: String,
}

impl ServerService {
    pub fn new() -> Self {
        Self {}
    }

    pub fn collect(&self) -> ServerInfo {
        let refresh = RefreshKind::everything();
        let mut sys = System::new_with_specifics(refresh);
        sys.refresh_cpu_usage();
        // Wait briefly so CPU usage has a meaningful delta
        std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
        sys.refresh_cpu_usage();

        let cpus = sys.cpus();
        let per_core_usage: Vec<f64> = cpus.iter().map(|c| c.cpu_usage() as f64).collect();
        let overall_usage = per_core_usage.iter().sum::<f64>() / per_core_usage.len().max(1) as f64;

        let load_avg = System::load_average();

        let total_mem = sys.total_memory() as f64 / 1024.0 / 1024.0 / 1024.0;
        let used_mem = sys.used_memory() as f64 / 1024.0 / 1024.0 / 1024.0;
        let available_mem = sys.available_memory() as f64 / 1024.0 / 1024.0 / 1024.0;
        let cached_mem = (sys.total_memory() - sys.available_memory() - sys.used_memory()) as f64 / 1024.0 / 1024.0 / 1024.0;

        let swap_total = sys.total_swap() as f64 / 1024.0 / 1024.0 / 1024.0;
        let swap_used = sys.used_swap() as f64 / 1024.0 / 1024.0 / 1024.0;

        // Disks
        let disks = Disks::new_with_specifics(RefreshKind::nothing().with_disks_list());
        let partitions: Vec<PartitionInfo> = disks
            .list()
            .iter()
            .map(|d: &Disk| {
                let total = d.total_space() as f64 / 1024.0 / 1024.0 / 1024.0;
                let used = (d.total_space() - d.available_space()) as f64 / 1024.0 / 1024.0 / 1024.0;
                PartitionInfo {
                    device: d.name().to_string_lossy().to_string(),
                    mount: d.mount_point().to_string_lossy().to_string(),
                    fs_type: d.file_system().to_string_lossy().to_string(),
                    total_gb: total,
                    used_gb: used,
                    used_percent: if total > 0.0 { (used / total) * 100.0 } else { 0.0 },
                }
            })
            .collect();
        let total_disk: f64 = partitions.iter().map(|p| p.total_gb).sum();
        let used_disk: f64 = partitions.iter().map(|p| p.used_gb).sum();

        // Networks
        let networks = Networks::new_with_refreshed_list();
        let interfaces: Vec<NetworkInterface> = networks
            .list()
            .iter()
            .map(|(name, data)| NetworkInterface {
                name: name.to_string(),
                ip: String::new(),
                mac: String::new(),
                inbound_mbps: data.received() as f64 / 1024.0 / 1024.0,
                outbound_mbps: data.transmitted() as f64 / 1024.0 / 1024.0,
                total_in_gb: data.total_received() as f64 / 1024.0 / 1024.0 / 1024.0,
                total_out_gb: data.total_transmitted() as f64 / 1024.0 / 1024.0 / 1024.0,
                is_up: true,
            })
            .collect();

        ServerInfo {
            hostname: System::host_name().unwrap_or_default(),
            os: System::name().unwrap_or_default(),
            kernel: System::kernel_version().unwrap_or_default(),
            uptime: System::uptime(),
            boot_time: chrono::DateTime::from_timestamp(System::boot_time() as i64, 0).unwrap_or_else(|| chrono::Utc::now()),
            cpu: CpuInfo {
                model: cpus.first().map(|c| c.brand().to_string()).unwrap_or_default(),
                cores: cpus.len(),
                physical_cores: System::physical_core_count().unwrap_or(cpus.len()),
                frequency_mhz: cpus.first().map(|c| c.frequency()).unwrap_or(0),
                load_avg1: load_avg.one,
                load_avg5: load_avg.five,
                load_avg15: load_avg.fifteen,
                per_core_usage,
                overall_usage,
            },
            memory: MemoryInfo {
                total_gb: total_mem,
                used_gb: used_mem,
                available_gb: available_mem,
                cached_gb: cached_mem.max(0.0),
                swap_total_gb: swap_total,
                swap_used_gb: swap_used,
            },
            disk: DiskInfo {
                total_gb: total_disk,
                used_gb: used_disk,
                available_gb: total_disk - used_disk,
                partitions,
            },
            network: NetworkInfo { interfaces },
            docker: DockerSummary {
                version: String::new(),
                containers_total: 0,
                containers_running: 0,
                containers_stopped: 0,
                images: 0,
                storage_driver: "overlay2".into(),
            },
        }
    }

    pub fn top_processes(&self, limit: usize) -> Vec<ProcessInfo> {
        let mut sys = System::new_all();
        sys.refresh_processes();

        let mut procs: Vec<_> = sys
            .processes()
            .iter()
            .map(|(pid, p)| ProcessInfo {
                pid: pid.as_u32(),
                name: p.name().to_string_lossy().to_string(),
                user: sysinfo::Users::new_with_refreshed_list()
                    .get_user_by_id(p.user_id())
                    .map(|u| u.name().to_string())
                    .unwrap_or_else(|| "—".into()),
                cpu_percent: p.cpu_usage() as f64,
                memory_mb: p.memory() as f64 / 1024.0,
                memory_percent: (p.memory() as f64 / sys.total_memory() as f64) * 100.0,
                status: format!("{:?}", p.status()),
                start_time: chrono::DateTime::from_timestamp(p.start_time() as i64, 0).unwrap_or_else(|| chrono::Utc::now()),
                command: p.cmd().join(" "),
            })
            .collect();

        procs.sort_by(|a, b| b.cpu_percent.partial_cmp(&a.cpu_percent).unwrap_or(std::cmp::Ordering::Equal));
        procs.truncate(limit);
        procs
    }
}
