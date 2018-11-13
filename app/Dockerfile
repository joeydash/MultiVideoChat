FROM node:latest

ADD . /app

RUN cd /app; \
    npm install --production

EXPOSE 3000

CMD ["node", "/app/bin/www"]