.PHONY: up down test e2e clean build seed

up: build
	@echo "🚀 Starting Finance OS..."
	docker-compose up -d
	@echo "⏳ Waiting for services..."
	sleep 10
	@echo "🌱 Running migrations and seed..."
	docker-compose exec backend npm run migrate
	docker-compose exec backend npm run seed
	@echo "✅ Finance OS is ready!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/api/docs"
	@echo "Login: admin@demo.com / admin123"

down:
	docker-compose down

clean:
	docker-compose down -v
	docker system prune -f

build:
	docker-compose build

test:
	@echo "🧪 Running tests..."
	docker-compose exec backend npm test
	docker-compose exec frontend npm test

e2e:
	@echo "🎭 Running E2E tests..."
	cd app/frontend && npm run e2e

seed:
	docker-compose exec backend npm run seed

logs:
	docker-compose logs -f

restart:
	docker-compose restart
