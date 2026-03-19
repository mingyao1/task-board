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
	"task-board/backend/internal/services"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	db, err := database.NewSupabaseClient(cfg.SupabaseURL, cfg.SupabasePublishableKey)
	if err != nil {
		log.Fatalf("failed to create supabase client: %v", err)
	}

	restClient := services.NewRestClient(cfg.SupabaseURL, cfg.SupabasePublishableKey)

	r := chi.NewRouter()
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RequestID)
	r.Use(middleware.CORS(cfg.FrontendURL))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status":"ok"}`)
	})

	taskHandler := handlers.NewTaskHandler(services.NewTaskService(restClient))
	teamMemberHandler := handlers.NewTeamMemberHandler(services.NewTeamService(restClient))
	labelHandler := handlers.NewLabelHandler(services.NewLabelService(restClient))
	commentHandler := handlers.NewCommentHandler(services.NewCommentService(restClient))
	activityHandler := handlers.NewActivityHandler(services.NewActivityService(restClient))
	statsHandler := handlers.NewStatsHandler(db)

	r.Route("/api/v1", func(r chi.Router) {
		r.Use(middleware.Auth(db))

		// Tasks — all flat, no nested r.Route to avoid chi sub-router param conflicts.
		// Chi resolves static segments (/reorder) before param segments (/{taskId}).
		r.Get("/tasks", taskHandler.List)
		r.Post("/tasks", taskHandler.Create)
		r.Patch("/tasks/reorder", taskHandler.Reorder)
		r.Patch("/tasks/{taskId}", taskHandler.Update)
		r.Delete("/tasks/{taskId}", taskHandler.Delete)

		// Nested task resources — full paths, no sub-router.
		r.Get("/tasks/{taskId}/activity", activityHandler.List)
		r.Get("/tasks/{taskId}/comments", commentHandler.List)
		r.Post("/tasks/{taskId}/comments", commentHandler.Create)
		r.Delete("/tasks/{taskId}/comments/{commentId}", commentHandler.Delete)

		teamMemberHandler.Routes(r)
		labelHandler.Routes(r)
		r.Get("/stats", statsHandler.Get)
	})

	addr := ":" + cfg.Port
	log.Printf("server listening on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
