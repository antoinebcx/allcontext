/**
 * Environment configuration with validation and fallbacks
 * Ensures all required environment variables are present
 */

interface EnvConfig {
  API_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  IS_PRODUCTION: boolean;
  IS_DEVELOPMENT: boolean;
}

class EnvironmentValidator {
  private errors: string[] = [];

  validateRequired(key: string, value: string | undefined): string {
    if (!value) {
      this.errors.push(`Missing required environment variable: ${key}`);
      return '';
    }
    return value;
  }

  validateUrl(key: string, value: string): string {
    if (!value) return value;

    try {
      new URL(value);
      return value;
    } catch {
      this.errors.push(`Invalid URL for ${key}: ${value}`);
      return value;
    }
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): string[] {
    return this.errors;
  }

  showErrorUI(): void {
    const errorHtml = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, sans-serif;
        z-index: 9999;
      ">
        <div style="
          max-width: 600px;
          padding: 32px;
          text-align: center;
        ">
          <h1 style="color: #d32f2f; margin-bottom: 16px;">
            Configuration Error
          </h1>
          <p style="color: #666; margin-bottom: 24px;">
            The application is missing required configuration. Please check your environment variables.
          </p>
          <div style="
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 16px;
            text-align: left;
            margin-bottom: 24px;
          ">
            <strong>Missing variables:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px;">
              ${this.errors.map(error => `<li style="color: #d32f2f;">${error}</li>`).join('')}
            </ul>
          </div>
          <p style="color: #999; font-size: 14px;">
            Please add these to your .env file and restart the application.
          </p>
        </div>
      </div>
    `;

    document.body.innerHTML = errorHtml;
  }
}

function createEnvConfig(): EnvConfig {
  const validator = new EnvironmentValidator();

  // Get environment variables with validation
  const apiUrl = validator.validateUrl(
    'VITE_API_URL',
    import.meta.env.VITE_API_URL || 'http://localhost:8000'
  );

  const supabaseUrl = validator.validateRequired(
    'VITE_SUPABASE_URL',
    import.meta.env.VITE_SUPABASE_URL
  );

  const supabaseAnonKey = validator.validateRequired(
    'VITE_SUPABASE_ANON_KEY',
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Check for critical errors (Supabase is required)
  const criticalErrors = validator.getErrors().filter(
    error => error.includes('SUPABASE')
  );

  // In development, show error UI for missing Supabase config
  // In production, try to continue with defaults
  if (criticalErrors.length > 0) {
    if (import.meta.env.DEV) {
      console.error('Environment validation failed:', criticalErrors);
      // Show error UI in development
      setTimeout(() => validator.showErrorUI(), 100);
    } else {
      // In production, log but don't crash
      console.warn('Missing environment variables:', criticalErrors);
    }
  }

  return {
    API_URL: apiUrl,
    SUPABASE_URL: supabaseUrl || '',
    SUPABASE_ANON_KEY: supabaseAnonKey || '',
    IS_PRODUCTION: import.meta.env.PROD,
    IS_DEVELOPMENT: import.meta.env.DEV,
  };
}

// Create and export the validated config
export const env = createEnvConfig();

// Export individual values for convenience
export const {
  API_URL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
} = env;

// Validate on startup
if (IS_DEVELOPMENT && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  console.warn(
    '%c⚠️ Missing Supabase configuration',
    'color: orange; font-weight: bold;',
    '\nThe app will have limited functionality without Supabase credentials.',
    '\nPlease add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  );
}
