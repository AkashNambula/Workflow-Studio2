import asyncio
import logging

from app.scheduler.leader_election import (
    become_leader,
    renew_leader,
    get_fencing_token
)


async def start_scheduler():

    logging.warning("[SCHEDULER] Starting...")

    while True:

        try:

            leader = await become_leader()

            if leader:

                logging.warning("[LEADER] This instance is Leader")

                token = await get_fencing_token()
                logging.warning(f"[LEADER] Fencing Token = {token}")

                while True:

                    # Renew Leader Lease
                    await renew_leader()

                    # Dummy Scheduled Job
                    logging.warning(
                        f"[LEADER] Executing Scheduled Job (Token={token})"
                    )

                    logging.warning("[LEADER] Lease Renewed")

                    await asyncio.sleep(5)

            else:

                logging.warning("[STANDBY] Waiting for Leader")
                await asyncio.sleep(5)

        except Exception as e:

            logging.exception(f"Scheduler crashed: {e}")
            await asyncio.sleep(5)