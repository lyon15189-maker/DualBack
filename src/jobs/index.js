import cron from "node-cron";
import {
    procesarClasesVencidas
} from "./procesarClasesVencidas.job.js";

export const iniciarJobs = () => {
    // console.log("Jobs iniciados ✅");
    // corrida inicial
    procesarClasesVencidas();
    cron.schedule(
        "*/15 * * * *",
        // "* * * * *",
        async () => {

            // console.log(
            //     "Ejecutando cron..."
            // );

            await procesarClasesVencidas();

        }
    );

};