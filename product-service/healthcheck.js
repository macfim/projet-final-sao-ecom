const { execSync } = require("child_process");

try {
  // Check if the Node.js process is running
  execSync("pgrep -f 'node.*index.js'", { encoding: "utf-8", stdio: "ignore" });
  process.exit(0);
} catch (error) {
  // Process not found
  process.exit(1);
}
