// Helper: convert sqlx PgRow results to serde_json::Value arrays.
// sqlx::query returns PgRow which doesn't implement Serialize,
// so we convert each row to a serde_json::Value.

use sqlx::postgres::PgRow;
use sqlx::Row;
use serde_json::{json, Map, Value};

/// Convert a single PgRow to a serde_json::Value object.
pub fn row_to_json(row: &PgRow) -> Value {
    let mut map = Map::new();
    for col in row.columns() {
        let name = col.name();
        let value: Value = match col.type_info().name() {
            "BOOL" => row.try_get::<Option<bool>, _>(name).unwrap_or(None).map(Value::from).unwrap_or(Value::Null),
            "INT2" => row.try_get::<Option<i16>, _>(name).unwrap_or(None).map(|v| Value::from(v as i64)).unwrap_or(Value::Null),
            "INT4" => row.try_get::<Option<i32>, _>(name).unwrap_or(None).map(|v| Value::from(v as i64)).unwrap_or(Value::Null),
            "INT8" => row.try_get::<Option<i64>, _>(name).unwrap_or(None).map(Value::from).unwrap_or(Value::Null),
            "FLOAT4" => row.try_get::<Option<f32>, _>(name).unwrap_or(None).map(|v| Value::from(v as f64)).unwrap_or(Value::Null),
            "FLOAT8" => row.try_get::<Option<f64>, _>(name).unwrap_or(None).map(Value::from).unwrap_or(Value::Null),
            "TEXT" | "VARCHAR" | "NAME" | "BPCHAR" => {
                row.try_get::<Option<String>, _>(name).unwrap_or(None).map(Value::from).unwrap_or(Value::Null)
            }
            "JSONB" | "JSON" => {
                row.try_get::<Option<Value>, _>(name).unwrap_or(None).unwrap_or(Value::Null)
            }
            "TIMESTAMPTZ" | "TIMESTAMP" => {
                row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>(name)
                    .unwrap_or(None)
                    .map(|dt| Value::from(dt.to_rfc3339()))
                    .unwrap_or(Value::Null)
            }
            "UUID" => {
                row.try_get::<Option<uuid::Uuid>, _>(name)
                    .unwrap_or(None)
                    .map(|u| Value::from(u.to_string()))
                    .unwrap_or(Value::Null)
            }
            "TEXT[]" | "_TEXT" => {
                row.try_get::<Option<Vec<String>>, _>(name)
                    .unwrap_or(None)
                    .map(|v| Value::from(v))
                    .unwrap_or(Value::Null)
            }
            _ => Value::Null,
        };
        map.insert(name.to_string(), value);
    }
    Value::Object(map)
}

/// Convert a Vec of PgRows to a JSON array.
pub fn rows_to_json(rows: &[PgRow]) -> Value {
    Value::Array(rows.iter().map(row_to_json).collect())
}
