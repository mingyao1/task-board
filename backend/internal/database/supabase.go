package database

import (
	"fmt"

	supa "github.com/supabase-community/supabase-go"
)

// NewSupabaseClient initialises and returns a supabase-go client.
// url is the project URL (e.g. https://xxx.supabase.co).
// key is the publishable key used for authenticated requests.
func NewSupabaseClient(url, key string) (*supa.Client, error) {
	client, err := supa.NewClient(url, key, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create supabase client: %w", err)
	}
	return client, nil
}
