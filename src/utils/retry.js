function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retry(fn, {
  retries = 3,
  delay = 300,
  backoff = 2,
  onRetry = () => {}
} = {}) {
  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;

      if (attempt === retries) break;

      onRetry(err, attempt + 1);
      await sleep(delay * Math.pow(backoff, attempt));
      attempt++;
    }
  }

  throw lastError;
}

module.exports = retry
