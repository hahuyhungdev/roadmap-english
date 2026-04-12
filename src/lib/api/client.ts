import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./generated";

const fetchClient = createFetchClient<paths>({
  baseUrl: "",
});

export const $api = createClient(fetchClient);
