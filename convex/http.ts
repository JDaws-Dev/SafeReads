import { httpRouter } from "convex/server";
import { auth } from "./auth";
import grantLifetime from "./grantLifetime";

const http = httpRouter();

// Grant lifetime subscription route (admin)
http.route({
  path: "/grantLifetime",
  method: "GET",
  handler: grantLifetime,
});

auth.addHttpRoutes(http);

export default http;
