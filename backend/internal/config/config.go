package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	SupabaseURL            string
	SupabasePublishableKey string
	Port                   string
	FrontendURL            string
}

// Load reads the .env file (if present) and populates a Config struct.
// Returns an error if any required variable is missing.
func Load() (*Config, error) {
	// Load .env file; ignore error if the file doesn't exist (env vars may be
	// injected directly in production).
	_ = godotenv.Load()

	cfg := &Config{
		SupabaseURL:            os.Getenv("SUPABASE_URL"),
		SupabasePublishableKey: os.Getenv("SUPABASE_PUBLISHABLE_KEY"),
		Port:                   os.Getenv("PORT"),
		FrontendURL:            os.Getenv("FRONTEND_URL"),
	}

	if cfg.SupabaseURL == "" {
		return nil, fmt.Errorf("SUPABASE_URL is required")
	}
	if cfg.SupabasePublishableKey == "" {
		return nil, fmt.Errorf("SUPABASE_PUBLISHABLE_KEY is required")
	}
	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	if cfg.FrontendURL == "" {
		cfg.FrontendURL = "http://localhost:5173"
	}

	return cfg, nil
}
