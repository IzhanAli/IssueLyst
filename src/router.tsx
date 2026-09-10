import {
  createRouter,
  parseSearchWith,
  stringifySearchWith,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Keep search params as raw strings, the way `URLSearchParams` did.
 *
 * Router's default serializer JSON-parses any value that *looks* like JSON,
 * and its `jsonStart` test matches anything starting with a digit. That turns
 * `?issue=142` into the number `142` on read and writes it back as
 * `?issue=%22142%22` — so bare issue keys and the day windows (`cw=7`) would
 * both break, along with every existing deep link and bookmark.
 *
 * Every param in `AppSearch` is a string, so an identity codec is both correct
 * and the only thing that preserves the previous URLs byte for byte.
 */
const parseSearch = parseSearchWith((value) => value);
const stringifySearch = stringifySearchWith((value) =>
  typeof value === "string" ? value : JSON.stringify(value),
);

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    parseSearch,
    stringifySearch,
  });
}
