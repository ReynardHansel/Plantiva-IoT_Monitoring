// import { getServerAuthSession } from "~/server/auth";
import { DashboardComponent } from "~/components/dashboard";
import { DashboardComponent_Dummy } from "~/components/dashboard_dummy";
import Dummy from "~/components/dummy";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  // const session = await getServerAuthSession();

  return (
    <HydrateClient>
      {/* <DashboardComponent_Dummy /> */}
      <DashboardComponent />
      {/* <Dummy /> */}
    </HydrateClient>
  );
}
