/* (foldername) --> this type of folder structure helps to create nested app routes with a seperate layout for each route
eg: Here, in this use case, We need the sidebar component in root ("/") routes, but not in auth routes. (foldername) marks the route as "Route Group" thus creating a seperate layout for auth - without the sidebar, & another layout for root - with sidebar. 
*/

import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loggedIn = await getLoggedInUser();

  if(!loggedIn) redirect("/sign-in"); //an alternative to router.push without making a component as client component.

  return (
    <main className="flex h-screen w-full font-inter">
      <Sidebar
        user={loggedIn}
      />

      {/* Mobile Nav bar */}
      <div className="flex size-full flex-col">
        <div className="root-layout">
          <Image
            src="/icons/logo.svg"
            alt="menu icon"
            width={30}
            height={30}
          />
          <div>
            <MobileNav user={loggedIn} />
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
