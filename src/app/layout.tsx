export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-sans antialiased bg-gray-50">
      {children}
    </div>
  );
}
