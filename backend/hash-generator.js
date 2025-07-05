import bcrypt from "bcryptjs";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Add meg a jelszót, amit hashelni szeretnél: ", (password) => {
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error("Hiba a hash generálásakor:", err);
    } else {
      console.log("\nGenerált hash:\n", hash);
    }
    rl.close();
  });
});
