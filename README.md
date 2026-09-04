# Warp Blocks website

The site is dependency-free HTML, CSS, and JavaScript served by Nginx. All
building and serving happens in Docker; no host package installation is needed.

## Run

From the `timewarp` directory:

```sh
docker compose up --build
```

Open <http://localhost:8080>. To use another port:

```sh
TIMEWARP_PORT=8090 docker compose up --build
```

Stop it with:

```sh
docker compose down
```

## Structure

- `site/index.html` — content and semantic page structure
- `site/styles.css` — responsive visual system
- `site/app.js` — controls, exact participation DP, model, and Canvas charts
- `site/smoke.js` — container-build DOM/runtime smoke test
- `site/nginx.conf` — static serving, security headers, and health endpoint
- `timewarp.md` — copied into the image at `/research/timewarp.md`

## Model labels

The UI deliberately distinguishes consensus rules, analytic approximations,
deterministic results, and economic scenarios. Keep these labels when changing
or adding charts.

The Docker build runs `node --check app.js` and the smoke test before producing
the Nginx image.

## Deploy to self-managed GitLab Pages

The repository-root `.gitlab-ci.yml` verifies the frontend and publishes only
the static application files. Nginx and Docker are not part of the Pages
deployment: GitLab Pages serves the generated `public/` artifact itself.

Push the repository's default branch:

```sh
git add .gitlab-ci.yml site/
git commit -m "Deploy Warp Blocks with GitLab Pages"
git push origin main
```

The pipeline contains two jobs:

1. `verify-site` runs JavaScript syntax and runtime smoke tests in
   `node:22-alpine`.
2. `pages` copies `index.html`, `styles.css`, and `app.js` into `public/` and
   publishes that directory as the Pages artifact.

With this GitLab configuration:

```ruby
pages_external_url "https://pagerizzly.cryptolization.com"
gitlab_pages['namespace_in_path'] = true
```

and the repository path `neuroslope/timewarp`, the expected path-based URL is:

```text
https://pagerizzly.cryptolization.com/neuroslope/timewarp/
```

The authoritative URL is shown after deployment under **Deploy → Pages** and in
the predefined `CI_PAGES_URL` variable. Newer GitLab versions may use a unique
Pages domain if that project-level option is enabled; disable **Use unique
domain** in the project's Pages settings if the path-based URL is preferred.

Requirements on GitLab:

- a Runner capable of using the `node:22-alpine` and `alpine:3.21` images;
- Pages enabled on the instance (already present in the supplied config);
- the default branch set correctly in the project;
- successful access by GitLab to the configured Pages object-storage bucket.

The global certificate for `pagerizzly.cryptolization.com` and HTTP-to-HTTPS
redirect are handled by the GitLab Pages service, not by this repository.
