import logging
import requests

_logger = logging.getLogger(__name__)
EXPU_PUSH_URL = "https://exp.host/--/api/v2/push/send"
EXPO_BATCH_SIZE = 100
EXPO_TIMEOUT_SEC = 10


def send_expo_push_batch(messages):
    if not messages:
        return []
    tickets = []
    for start in range(0, len(messages), EXPO_BATCH_SIZE):
        batch = messages[start : start + EXPO_BATCH_SIZE]
        try:
            resp = requests.post(
                EXPO_PUSH_URL,
                json=batch,
                headers={"Content-Type": "application/json"},
                timeout=EXPO_TIMEOUT_SEC,
            )
            resp.raise_for_status()
            payload = resp.json()
            batch_tickets = payload.get("data", []) if isinstance(payload, dict) else []
            tickets.extend(batch_tickets)
            _logger.info(
                "Expo push sent: %d messages, %d tickets",
                len(batch),
                len(batch_tickets),
            )
        except Exception as exc:
            _logger.warning("Expo push failed for batch of %d: %s", len(batch), exc)
    return tickets
