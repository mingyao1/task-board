package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

// RestClient makes authenticated requests to the Supabase PostgREST API.
type RestClient struct {
	baseURL string // e.g. https://xxx.supabase.co/rest/v1
	apiKey  string
	http    *http.Client
}

// NewRestClient creates a new RestClient.
func NewRestClient(supabaseURL, apiKey string) *RestClient {
	return &RestClient{
		baseURL: supabaseURL + "/rest/v1",
		apiKey:  apiKey,
		http:    &http.Client{},
	}
}

// RequestOptions configures a single PostgREST request.
type RequestOptions struct {
	Method      string
	Path        string
	Token       string
	Body        interface{}
	QueryParams map[string]string
	Headers     map[string]string
}

// Do executes an HTTP request to the PostgREST API.
// Returns the response body bytes, HTTP status code, and any transport-level error.
func (c *RestClient) Do(ctx context.Context, opts RequestOptions) ([]byte, int, error) {
	var bodyReader io.Reader
	if opts.Body != nil {
		data, err := json.Marshal(opts.Body)
		if err != nil {
			return nil, 0, fmt.Errorf("marshal body: %w", err)
		}
		bodyReader = bytes.NewReader(data)
	}

	u, err := url.Parse(c.baseURL + opts.Path)
	if err != nil {
		return nil, 0, fmt.Errorf("parse url: %w", err)
	}
	if len(opts.QueryParams) > 0 {
		q := url.Values{}
		for k, v := range opts.QueryParams {
			q.Set(k, v)
		}
		u.RawQuery = q.Encode()
	}

	req, err := http.NewRequestWithContext(ctx, opts.Method, u.String(), bodyReader)
	if err != nil {
		return nil, 0, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+opts.Token)
	req.Header.Set("apikey", c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	for k, v := range opts.Headers {
		req.Header.Set(k, v)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, 0, fmt.Errorf("execute request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, resp.StatusCode, fmt.Errorf("read response: %w", err)
	}

	return respBody, resp.StatusCode, nil
}
