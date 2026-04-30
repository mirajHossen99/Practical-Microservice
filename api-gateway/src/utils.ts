import { Express, Request, Response } from "express";
import config from "./config.json";
import axios from "axios";

export const createHandler = (
  hostname: string,
  path: string,
  method: string,
) => {
  return async (req: Request, res: Response) => {
    try {
      let url = `${hostname}${path}`;
      req.params && Object.keys(req.params).forEach(param => {
        const value = req.params[param];
        if (!value) return;

        const stringValue = Array.isArray(value) ? value[0] : value;
        url = url.replace(`:${param}`, stringValue);
      });

      const { data } = await axios({
        method,
        url,
        data: req.body,
        headers: {
          origin: 'http://localhost:8081',
        }
      });
      res.json(data);

    } catch (error) {
      if (error instanceof axios.AxiosError) {
        return res
          .status(error.response?.status || 500)
          .json(error.response?.data);
      }

      console.log(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
};

export const configureRoutes = (app: Express) => {
  Object.entries(config.services).forEach(([name, service]) => {
    const hostname = service.url;

    service.routes.forEach((route) => {
      route.methods.forEach((method) => {
        const handler = createHandler(hostname, route.path, method);
        app[method](`/api/v1${route.path}`, handler);
      });
    });
  });
};
