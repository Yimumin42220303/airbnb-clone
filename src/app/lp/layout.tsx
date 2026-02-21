/**
 * LP用レイアウト：共通Header/Footerなし。各LPページでシンプルヘッダーを実装。
 */
export default function LpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
