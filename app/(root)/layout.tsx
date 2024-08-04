/* (foldername) --> this type of folder structure helps to create nested app routes with a seperate layout for each route
eg: Here, in this use case, We need the sidebar component in root ("/") routes, but not in auth routes. (foldername) marks the route as "Route Group" thus creating a seperate layout for auth - without the sidebar, & another layout for root - with sidebar. 
*/

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
        SIDEBAR
        {children}
    </main>
  );
}
