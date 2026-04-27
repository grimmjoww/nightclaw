//! Generic HTTP voice synthesis bridge.
//!
//! NightClaw does not bundle paid, restricted, or heavyweight TTS engines.
//! The frontend builds provider-specific JSON requests, then this backend
//! sends them with reqwest so local servers and cloud APIs are not blocked by
//! browser CORS rules.

use reqwest::header::{HeaderName, HeaderValue};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceHttpRequest {
    endpoint: String,
    method: String,
    headers: HashMap<String, String>,
    body: serde_json::Value,
    mime_type: String,
    extension: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceHttpResult {
    bytes: Vec<u8>,
    mime_type: String,
    extension: String,
}

#[tauri::command]
pub async fn synthesize_voice_http(request: VoiceHttpRequest) -> Result<VoiceHttpResult, String> {
    if request.method.to_uppercase() != "POST" {
        return Err("Only POST voice synthesis requests are supported".to_string());
    }
    if !(request.endpoint.starts_with("http://") || request.endpoint.starts_with("https://")) {
        return Err("Voice endpoint must start with http:// or https://".to_string());
    }

    let client = reqwest::Client::new();
    let mut builder = client.post(&request.endpoint);

    for (name, value) in &request.headers {
        let lower = name.to_ascii_lowercase();
        if lower == "host" || lower == "content-length" {
            continue;
        }
        let header_name = HeaderName::from_bytes(name.as_bytes())
            .map_err(|e| format!("Invalid voice header '{}': {}", name, e))?;
        let header_value = HeaderValue::from_str(value)
            .map_err(|e| format!("Invalid voice header value for '{}': {}", name, e))?;
        builder = builder.header(header_name, header_value);
    }

    let response = builder
        .json(&request.body)
        .send()
        .await
        .map_err(|e| format!("Voice provider request failed: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let detail = response.text().await.unwrap_or_default();
        return Err(format!(
            "Voice provider returned HTTP {}{}",
            status,
            if detail.is_empty() {
                String::new()
            } else {
                format!(": {}", detail)
            }
        ));
    }

    let mime_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .map(|value| value.split(';').next().unwrap_or(value).to_string())
        .unwrap_or(request.mime_type);

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read voice response: {}", e))?
        .to_vec();

    Ok(VoiceHttpResult {
        bytes,
        mime_type,
        extension: request.extension,
    })
}
