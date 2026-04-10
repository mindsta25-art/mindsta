/**
 * Circuit Breaker Service
 * Prevents cascading failures by temporarily stopping calls to failing services
 */

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    this.nextAttemptTime = null;
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 2) { // Require 2 successes to close
        this.state = 'CLOSED';
        this.successCount = 0;
        console.log('[CircuitBreaker] Circuit CLOSED - service recovered');
      }
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.recoveryTimeout;
      console.log('[CircuitBreaker] Circuit OPEN - service still failing');
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.recoveryTimeout;
      console.log('[CircuitBreaker] Circuit OPEN - failure threshold exceeded');
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }
}

// Circuit breakers for different services
export const emailCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 300000, // 5 minutes
});

export const paymentCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  recoveryTimeout: 600000, // 10 minutes
});

export const externalApiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 10,
  recoveryTimeout: 120000, // 2 minutes
});

// Helper function to execute with circuit breaker
export const withCircuitBreaker = (circuitBreaker, operation) => {
  return circuitBreaker.execute(operation);
};

export default CircuitBreaker;