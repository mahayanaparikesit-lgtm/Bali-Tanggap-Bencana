import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { PrivateRoute } from "@/components/PrivateRoute";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

import PelaporDashboard from "@/pages/pelapor/PelaporDashboard";
import LaporanBaru from "@/pages/pelapor/LaporanBaru";
import LaporanDetail from "@/pages/pelapor/LaporanDetail";

import RelawanDashboard from "@/pages/relawan/RelawanDashboard";
import RelawanDaftar from "@/pages/relawan/RelawanDaftar";
import RelawanDetail from "@/pages/relawan/RelawanDetail";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminLaporan from "@/pages/admin/AdminLaporan";
import AdminLaporanDetail from "@/pages/admin/AdminLaporanDetail";
import AdminRelawan from "@/pages/admin/AdminRelawan";
import AdminInventaris from "@/pages/admin/AdminInventaris";
import AdminPenugasan from "@/pages/admin/AdminPenugasan";
import AdminDonasi from "@/pages/admin/AdminDonasi";

import DonaturDashboard from "@/pages/donatur/DonaturDashboard";
import Transparansi from "@/pages/Transparansi";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/transparansi" component={Transparansi} />
      {/* Lapor darurat — sengaja TANPA login (PrivateRoute), lihat § F. Punya akun
          pelapor memang tetap bisa lapor lewat /pelapor/laporan-baru di bawah,
          tapi ini jalur utama karena skenario kritis tidak boleh diblokir akun. */}
      <Route path="/lapor" component={LaporanBaru} />

      {/* Donatur Routes — login required */}
      <Route path="/donatur">
        {(params) => <PrivateRoute component={DonaturDashboard} allowedRoles={["donatur"]} {...params} />}
      </Route>

      {/* Pelapor Routes — login required */}
      <Route path="/pelapor">
        {(params) => <PrivateRoute component={PelaporDashboard} allowedRoles={["pelapor"]} {...params} />}
      </Route>
      <Route path="/pelapor/laporan-baru">
        {(params) => <PrivateRoute component={LaporanBaru} allowedRoles={["pelapor"]} {...params} />}
      </Route>
      <Route path="/pelapor/laporan/:id">
        {(params) => <PrivateRoute component={LaporanDetail} allowedRoles={["pelapor"]} {...params} />}
      </Route>

      {/* Relawan Routes — login required */}
      <Route path="/relawan">
        {(params) => <PrivateRoute component={RelawanDashboard} allowedRoles={["relawan", "admin"]} {...params} />}
      </Route>
      <Route path="/relawan/daftar">
        {(params) => <PrivateRoute component={RelawanDaftar} allowedRoles={["relawan", "admin"]} {...params} />}
      </Route>
      <Route path="/relawan/:id">
        {(params) => <PrivateRoute component={RelawanDetail} allowedRoles={["relawan", "admin"]} {...params} />}
      </Route>

      {/* Admin Routes — login required */}
      <Route path="/admin">
        {(params) => <PrivateRoute component={AdminDashboard} allowedRoles={["admin"]} {...params} />}
      </Route>
      <Route path="/admin/laporan">
        {(params) => <PrivateRoute component={AdminLaporan} allowedRoles={["admin"]} {...params} />}
      </Route>
      <Route path="/admin/laporan/:id">
        {(params) => <PrivateRoute component={AdminLaporanDetail} allowedRoles={["admin"]} {...params} />}
      </Route>
      <Route path="/admin/relawan">
        {(params) => <PrivateRoute component={AdminRelawan} allowedRoles={["admin"]} {...params} />}
      </Route>
      <Route path="/admin/inventaris">
        {(params) => <PrivateRoute component={AdminInventaris} allowedRoles={["admin"]} {...params} />}
      </Route>
      <Route path="/admin/penugasan">
        {(params) => <PrivateRoute component={AdminPenugasan} allowedRoles={["admin"]} {...params} />}
      </Route>
      <Route path="/admin/donasi">
        {(params) => <PrivateRoute component={AdminDonasi} allowedRoles={["admin"]} {...params} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
