import fs from "node:fs";

const filePath = "./node_modules/jpg-stream/build/jpeg.js";

let content = fs.readFileSync(filePath, "utf8");

content = content.replace(
  `process["on"]("uncaughtException"`,
  `process["on"]("__need_to_break__uncaughtException"`
);

fs.writeFileSync(filePath, content);
