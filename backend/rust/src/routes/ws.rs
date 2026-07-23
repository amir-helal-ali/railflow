// WebSocket routes: /api/ws/*
// Real-time: container stats, docker events, logs, server metrics.

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, Query, State,
    },
    response::Response,
    routing::get,
    Router,
};
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use std::time::Duration;

use crate::{
    error::AppError,
    services::state::SharedState,
};

pub fn router() -> Router<SharedState> {
    Router::new()
        .route("/api/ws/stats/:container_id", get(ws_stats))
        .route("/api/ws/events", get(ws_events))
        .route("/api/ws/logs/:container_id", get(ws_logs))
        .route("/api/ws/server", get(ws_server))
}

async fn ws_stats(
    ws: WebSocketUpgrade,
    State(state): State<SharedState>,
    Path(container_id): Path<String>,
) -> Response {
    ws.on_upgrade(move |mut socket| async move {
        let mut rx = state.docker.stats_stream(container_id);

        while let Some(result) = rx.recv().await {
            match result {
                Ok(stats) => {
                    let json = match serde_json::to_string(&stats) {
                        Ok(j) => j,
                        Err(_) => continue,
                    };
                    if socket.send(Message::Text(json)).await.is_err() {
                        break;
                    }
                }
                Err(e) => {
                    let _ = socket.send(Message::Text(format!("{{\"error\": \"{e}\"}}"))).await;
                    break;
                }
            }
        }
    })
}

async fn ws_events(
    ws: WebSocketUpgrade,
    State(state): State<SharedState>,
) -> Response {
    ws.on_upgrade(move |mut socket| async move {
        let mut rx = state.docker.events_stream();

        while let Some(result) = rx.recv().await {
            match result {
                Ok(event) => {
                    let json = match serde_json::to_string(&event) {
                        Ok(j) => j,
                        Err(_) => continue,
                    };
                    if socket.send(Message::Text(json)).await.is_err() {
                        break;
                    }
                }
                Err(e) => {
                    let _ = socket.send(Message::Text(format!("{{\"error\": \"{e}\"}}"))).await;
                    break;
                }
            }
        }
    })
}

async fn ws_logs(
    ws: WebSocketUpgrade,
    State(state): State<SharedState>,
    Path(container_id): Path<String>,
) -> Response {
    ws.on_upgrade(move |mut socket| async move {
        match state.docker.logs_stream(&container_id, 200).await {
            Ok(mut stream) => {
                while let Some(result) = stream.next().await {
                    match result {
                        Ok(line) => {
                            if socket.send(Message::Text(line)).await.is_err() {
                                break;
                            }
                        }
                        Err(e) => {
                            let _ = socket.send(Message::Text(format!("{{\"error\": \"{e}\"}}"))).await;
                            break;
                        }
                    }
                }
            }
            Err(e) => {
                let _ = socket.send(Message::Text(format!("{{\"error\": \"{e}\"}}"))).await;
            }
        }
    })
}

#[derive(Deserialize)]
struct ServerQuery {
    interval_ms: Option<u64>,
}

async fn ws_server(
    ws: WebSocketUpgrade,
    State(state): State<SharedState>,
    Query(q): Query<ServerQuery>,
) -> Response {
    let interval_ms = q.interval_ms.unwrap_or(2000);

    ws.on_upgrade(move |mut socket| async move {
        let mut ticker = tokio::time::interval(Duration::from_millis(interval_ms));

        loop {
            ticker.tick().await;
            let info = state.server.collect();
            let json = match serde_json::to_string(&info) {
                Ok(j) => j,
                Err(_) => continue,
            };
            if socket.send(Message::Text(json)).await.is_err() {
                break;
            }
        }
    })
}
