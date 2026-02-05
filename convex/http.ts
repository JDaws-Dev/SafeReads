import { httpRouter } from "convex/server";
import { auth } from "./auth";
import grantLifetime from "./grantLifetime";
import deleteUser from "./deleteUser";

const http = httpRouter();

// Grant lifetime subscription route (admin)
http.route({
  path: "/grantLifetime",
  method: "GET",
  handler: grantLifetime,
});

// Delete user and all associated data route (admin)
http.route({
  path: "/deleteUser",
  method: "GET",
  handler: deleteUser,
});

auth.addHttpRoutes(http);

export default http;
