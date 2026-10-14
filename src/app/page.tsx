import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="nw-bg flex-1 flex flex-col items-center px-4 py-8 relative overflow-hidden">
      {/* Glow decorativo */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-64 bg-amber-600/10 blur-3xl" />

      <div className="relative z-10 max-w-md w-full flex flex-col items-center gap-5">
        {/* Poster / Logo */}
        <div className="relative w-full aspect-[4/5] max-h-[42vh] rounded-2xl overflow-hidden border border-amber-600/40 shadow-2xl shadow-amber-900/30">
          <Image
            src="/assets/ui/poster.png"
            alt="Ngola War"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        <div className="text-center space-y-1 -mt-2">
          <h1 className="nw-title text-4xl tracking-wide">NGOLA WAR</h1>
          <p className="text-amber-200/70 text-sm tracking-widest uppercase">
            Damas · Estratégia · Conquista
          </p>
        </div>

        <div className="w-full flex flex-col gap-3 mt-2">
          <Link href="/auth/login" className="nw-btn-gold w-full py-3.5 text-center text-base">
            Entrar no Império
          </Link>
          <Link href="/auth/register" className="nw-btn-ghost w-full py-3.5 text-center font-semibold">
            Criar conta gratuita
          </Link>
          <Link
            href="/game/"
            className="w-full py-3 text-center text-sm text-stone-400 hover:text-amber-300 transition"
          >
            ⚔️ Treinar batalha
          </Link>
        </div>

        {/* Mini preview peças */}
        <div className="w-full nw-panel p-3 mt-2">
          <p className="text-[10px] text-amber-500/80 uppercase tracking-wider mb-2 text-center">
            Peças do jogo
          </p>
          <div className="flex justify-center gap-3">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-red-500/50">
              <Image src="/assets/pieces/angola-peao.jpg" alt="Peão" fill className="object-cover" />
            </div>
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-red-500/50">
              <Image src="/assets/pieces/angola-cavaleiro.jpg" alt="Cavaleiro" fill className="object-cover" />
            </div>
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400/60">
              <Image src="/assets/pieces/angola-rei.jpg" alt="Rei" fill className="object-cover" />
            </div>
          </div>
          <p className="text-[10px] text-stone-500 text-center mt-2">
            Peão 10 Kz · Cavaleiro 25 Kz · Rei 50 Kz
          </p>
        </div>

        <Link href="/admin" className="text-[10px] text-stone-600 hover:text-stone-400 mt-2">
          Área administrativa
        </Link>
      </div>
    </main>
  );
}
