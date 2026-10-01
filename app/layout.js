export const metadata = {
  title: 'Veel Thrifts — New In Thrift Fashion',
  description:
    'Veel Thrifts — sustainably thrifted clothing, shoes and accessories. Shop new-in vintage and pre-loved finds.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#171c3a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
