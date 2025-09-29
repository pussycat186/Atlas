use wasm_bindgen::prelude::*;
use sha2::{Sha256, Digest};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn hash(input: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    hex::encode(hasher.finalize())
}

#[wasm_bindgen]
pub fn verify(data: &str, expected_hash: &str) -> bool {
    hash(data) == expected_hash
}

#[wasm_bindgen]
pub fn normalize(input: &str) -> String {
    input.trim().to_lowercase()
}