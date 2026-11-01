import { describe, expect, it } from "vitest";
import { alasanGagal, alurKonfirmasi, halamanBerhasil, halamanGagal } from "@/lib/konfirmasi";

describe("alur tautan email /auth/konfirmasi", () => {
  it("menentukan jenis alur dari type dan next", () => {
    expect(alurKonfirmasi("signup", "/dashboard")).toBe("verifikasi");
    expect(alurKonfirmasi("email", "/dashboard")).toBe("verifikasi");
    expect(alurKonfirmasi(null, "/dashboard")).toBe("verifikasi"); // alur kode (PKCE)
    expect(alurKonfirmasi("recovery", "/dashboard")).toBe("pemulihan");
    expect(alurKonfirmasi(null, "/atur-ulang-kata-sandi")).toBe("pemulihan");
    expect(alurKonfirmasi("email_change", "/dashboard")).toBe("lainnya");
    expect(alurKonfirmasi("magiclink", "/dashboard")).toBe("lainnya");
  });

  it("verifikasi pendaftaran berhasil → halaman masuk, bukan langsung dashboard", () => {
    expect(halamanBerhasil("verifikasi", "/dashboard", "pengguna")).toBe("/masuk?verifikasi=berhasil");
    expect(halamanBerhasil("verifikasi", "/dashboard", "admin")).toBe("/masuk?verifikasi=berhasil");
  });

  it("pemulihan dan ganti email tetap memakai alur lama", () => {
    expect(halamanBerhasil("pemulihan", "/atur-ulang-kata-sandi", "pengguna")).toBe("/atur-ulang-kata-sandi");
    expect(halamanBerhasil("lainnya", "/profil", "pengguna")).toBe("/profil");
    expect(halamanBerhasil("lainnya", "/dashboard", "admin")).toBe("/admin");
  });

  it("tautan gagal: verifikasi → halaman galat dengan alasan; pemulihan → halaman atur ulang", () => {
    expect(halamanGagal("verifikasi", alasanGagal("otp_expired"))).toBe("/auth/verifikasi-gagal?alasan=kedaluwarsa");
    expect(halamanGagal("verifikasi", alasanGagal(null))).toBe("/auth/verifikasi-gagal?alasan=tidak_valid");
    expect(halamanGagal("lainnya", alasanGagal("bad_jwt"))).toBe("/auth/verifikasi-gagal?alasan=tidak_valid");
    expect(halamanGagal("pemulihan", alasanGagal("otp_expired"))).toBe("/atur-ulang-kata-sandi?galat=kedaluwarsa");
  });
});
