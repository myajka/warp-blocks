FROM node:22-alpine AS verify

WORKDIR /verify
COPY site/index.html site/app.js site/smoke.js ./
RUN node --check app.js && node smoke.js && touch /verify/verified

FROM nginx:1.27-alpine

COPY --from=verify /verify/verified /tmp/frontend-verified
COPY site/nginx.conf /etc/nginx/conf.d/default.conf
COPY site/index.html site/styles.css site/app.js /usr/share/nginx/html/
COPY timewarp.md /usr/share/nginx/html/research/timewarp.md

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
