import { createContext, useContext, useState, ReactNode } from "react";

// State shape mengikuti design_handoff_bali_rief/README.md § State Management
// ("Donation flow"). Dibuat scoped ke satu sesi alur donasi (dipasang di
// app/donatur/lokasi/[id]/_layout implisit lewat provider di setiap entry
// screen) — bukan persisted, direset tiap kali pengguna mulai donasi baru.
export type DonationType = "uang" | "barang" | null;

export interface BarangItem {
  namaItem: string;
  jumlah: number;
}

export interface DonationFlowState {
  locationId: number | null;
  donationType: DonationType;
  amount: number | null;
  items: BarangItem[];
  anonymous: boolean;
  donorName: string;
  note: string;
  paymentMethod: "transfer" | "ewallet" | "qris" | null;
  handoverMethod: "antar" | "jemput" | null;
  pickupAddress: string;
}

const initialState: DonationFlowState = {
  locationId: null,
  donationType: null,
  amount: null,
  items: [],
  anonymous: false,
  donorName: "",
  note: "",
  paymentMethod: null,
  handoverMethod: null,
  pickupAddress: "",
};

interface DonationFlowContextType {
  state: DonationFlowState;
  update: (patch: Partial<DonationFlowState>) => void;
  reset: () => void;
}

const DonationFlowContext = createContext<DonationFlowContextType | null>(null);

export function DonationFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DonationFlowState>(initialState);

  const update = (patch: Partial<DonationFlowState>) => setState(s => ({ ...s, ...patch }));
  const reset = () => setState(initialState);

  return (
    <DonationFlowContext.Provider value={{ state, update, reset }}>
      {children}
    </DonationFlowContext.Provider>
  );
}

export function useDonationFlow() {
  const ctx = useContext(DonationFlowContext);
  if (!ctx) throw new Error("useDonationFlow must be used inside DonationFlowProvider");
  return ctx;
}
