import { Command } from "commander";

export const registerDoctorCommand = (program: Command) => {
  program
    .command("doctor")
    .description("Diagnose environment and config (todo)")
    .action(async () => {
      console.log("Doctor is not implemented yet.");
    });
};
