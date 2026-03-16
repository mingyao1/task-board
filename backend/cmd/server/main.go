package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"

	"task-board/backend/internal/config"
	"task-board/backend/internal/database"
	"task-board/backend/internal/handlers"
	"task-board/backend/internal/middleware"
)

func main() {
	// Load configuration from .env / environment variables.
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	// Initialise the Supabase client.
	db, err := database.NewSupabaseClient(cfg.SupabaseURL, cfg.SupabasePublishableKey)
	if err != nil {
		log.Fatalf("failed to create supabase client: %v", err)
	}

	// Build the chi router.
	r := chi.NewRouter()

	// Global middleware.
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RequestID)
	r.Use(middleware.CORS(cfg.FrontendURL))

	// Health check — no auth required.
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status":"ok"}`)
	})

	// Instantiate handlers.
	taskHandler := handlers.NewTaskHandler(db)
	teamMemberHandler := handlers.NewTeamMemberHandler(db)
	labelHandler := handlers.NewLabelHandler(db)
	commentHandler := handlers.NewCommentHandler(db)
	activityHandler := handlers.NewActivityHandler(db)
	statsHandler := handlers.NewStatsHandler(db)

	// All /api/v1 routes require authentication.
	r.Route("/api/v1", func(r chi.Router) {
		r.Use(middleware.Auth(db))

		// Tasks (flat routes + nested sub-resources).
		taskHandler.Routes(r)

		// Nested task sub-resources: comments and activity log.
		r.Route("/tasks/{taskId}", func(r chi.Router) {
			commentHandler.Routes(r)
			r.Get("/activity", activityHandler.List)
		})

		// Team members.
		teamMemberHandler.Routes(r)

		// Labels.
		labelHandler.Routes(r)

		// Board stats.
		r.Get("/stats", statsHandler.Get)
	})

	addr := ":" + cfg.Port
	log.Printf("server listening on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
