# Beryllium

build epub reader for self hosted

## features

- easy to deploy, and you own all of your data
- desktop and mobile support
- dark mode
- bookmark and highlight support
- multi-user support

## how to use

if you want to build from source, see `how to develop` below.

generally, you should use [docker image](https://hub.docker.com/r/lee88688/beryllium) directly. here is the example of docker compose config.

```yaml
version: "3"
services:
  beryllium:
    image: lee88688/beryllium
    ports:
      - 3000:3000
    environment:
      # this env should be add, do not add quote to password string
      - ADMIN_USER_PASSWORD=some-password
      # the default admin user name is admin,
      # if you want to rename, please uncomment this line
      # - ADMIN_USER_NAME="admin"
    volumes:
      - /path/to/data:/app/data
```

`/app/data/db.sqlite` stores the database, and `/app/data/asar` stores the upload epub files.

### NOTE

the epub file uploaded from the user will be transformed into the asar file format. the asar file is just like tar file which combine the extracted files inside epub into one. so you should keep you epub files if you want to reuse them later. and there is a way to convert asar file to epub.

## how to development

- create `.env` file, like `.env.example`
- prisma
  - `npx prisma db push`, push schema to db
  - `npx prisma db seed`, seed db

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
