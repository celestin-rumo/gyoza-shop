# Frontend

The Gyoza Maison storefront, built with [Angular](https://angular.dev) (v22) and server-side rendered (SSR) through Angular's built-in Node/Express integration. Scaffolded with Angular CLI 22.1.4.

- **Framework**: Angular 22, standalone components, signals-based state
- **Server**: Express via `@angular/ssr`, entry point at [src/server.ts](src/server.ts)
- **Tests**: [Vitest](https://vitest.dev/)
- **Package manager**: npm

## Running with Docker Compose

The project is containerized and orchestrated from the repository root via Docker Compose, with separate configurations for development and production.

### Development

```bash
docker compose -f docker-compose.dev.yml up
```

This builds the frontend image from [Dockerfile.dev](Dockerfile.dev), mounts the local source into the container, installs dependencies, and runs `ng serve` with live reload. The app is available at `http://localhost:4200`.

### Production

```bash
docker compose -f docker-compose.prod.yml up --build
```

This builds the frontend image from [Dockerfile.prod](Dockerfile.prod) using a multi-stage build: it installs dependencies and runs `ng build` in a build stage, then copies only the compiled output into a slim runtime image that starts the Express SSR server. The app is available at `http://localhost:4000`.

## Running without Docker

To start a local development server, run:

```bash
npm ci
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
