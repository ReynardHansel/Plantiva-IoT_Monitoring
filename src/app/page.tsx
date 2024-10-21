// import { getServerAuthSession } from "~/server/auth";
import { DashboardComponent } from "~/components/dashboard";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  // const session = await getServerAuthSession();

  return (
    <HydrateClient>
      <DashboardComponent />
    </HydrateClient>
  );
}
