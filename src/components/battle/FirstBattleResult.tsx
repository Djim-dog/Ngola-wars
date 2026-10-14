'use client';

interface FirstBattleResultProps {
  won: boolean;
  onClose: () => void;
  titleWin?: string;
  messageWin?: string;
  titleLose?: string;
  messageLose?: string;
}

export default function FirstBattleResult({
  won,
  onClose,
  titleWin = 'Vitoria!',
  messageWin = 'Recebeste a recompensa da batalha.',
  titleLose = 'Derrota!',
  messageLose = 'O teu reino ainda pode recuperar.',
}: FirstBattleResultProps) {
  if (won) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
        <div className="w-full max-w-sm text-center space-y-6 p-6 rounded-2xl bg-stone-900 border border-amber-500/40 shadow-2xl">
          <div className="text-7xl animate-bounce">📦</div>
          <div className="text-5xl -mt-4 animate-pulse">✨</div>
          <h2 className="text-2xl font-bold text-amber-400">{titleWin}</h2>
          <p className="text-stone-200 text-sm">{messageWin}</p>
          <button onClick={onClose} className="nw-btn-gold w-full py-3">
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm text-center space-y-5 p-6 rounded-2xl bg-stone-900 border border-stone-700">
        <div className="text-5xl opacity-60">💔</div>
        <h2 className="text-xl font-bold text-stone-200">{titleLose}</h2>
        <p className="text-stone-300 text-sm">{messageLose}</p>
        <button onClick={onClose} className="w-full py-3 rounded-xl bg-stone-700 text-white font-semibold">
          Continuar
        </button>
      </div>
    </div>
  );
}
