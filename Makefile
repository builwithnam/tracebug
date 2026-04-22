.PHONY: help dev build test install clean

help:
	@echo "Tracebug Development Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  dev          Start development environment (web + API servers)"
	@echo "  build        Build all packages"
	@echo "  test         Run all tests"
	@echo "  install      Install dependencies"
	@echo "  clean        Clean build artifacts and cache"
	@echo ""
	@echo "Use pnpm directly for:"
	@echo "  pnpm lint       Lint all packages"
	@echo "  pnpm lint:fix   Lint and fix all packages"
	@echo "  pnpm format     Format code with Prettier"
	@echo "  pnpm check      Run lint + format check"

dev:
	@./scripts/dev.sh

build:
	@pnpm build

test:
	@pnpm test

install:
	@pnpm install

clean:
	@echo "Cleaning build artifacts and cache..."
	@rm -rf apps/*/dist packages/*/dist
	@rm -rf .turbo
	@pnpm exec turbo prune
	@echo "Done!"
