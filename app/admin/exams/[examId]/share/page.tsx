"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppUrl } from "@/hooks/useAppUrl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Copy, Mail } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  selected: boolean;
}

interface Exam {
  id: number;
  title: string;
  access_code: string;
}

export default function ShareExamPage({ params }: { params: { examId: string } }) {
  const router = useRouter();
  const appUrl = useAppUrl(); // useAppUrl hook'unu kullan
  const [exam, setExam] = useState<Exam | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // appUrl değiştiğinde log ekle
  useEffect(() => {
    console.log("[ShareExamPage] useAppUrl hook'undan gelen URL:", appUrl);
  }, [appUrl]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Sınav bilgilerini getir
        const examResponse = await fetch(`/api/admin/exams/${params.examId}`);
        if (!examResponse.ok) {
          throw new Error("Sınav bilgileri yüklenirken bir hata oluştu");
        }
        const examData = await examResponse.json();
        setExam(examData);

        // Personel listesini getir - tüm personeli almak için limit=1000 eklendi
        const usersResponse = await fetch("/api/admin/users?role=PERSONEL&limit=1000");
        if (!usersResponse.ok) {
          throw new Error("Personel listesi yüklenirken bir hata oluştu");
        }
        const usersData = await usersResponse.json();
        console.log("Personel verileri:", usersData); // Debug için

        // Kullanıcıları formatlayıp state'e ekle
        if (usersData.users && Array.isArray(usersData.users)) {
          const formattedUsers = usersData.users.map((user: any) => ({
            ...user,
            selected: false
          }));
          setUsers(formattedUsers);
          setFilteredUsers(formattedUsers);
        } else {
          console.error("Unexpected users data format:", usersData);
          toast.error("Personel listesi beklenmeyen formatta");
        }

        // Kullanıcı ayarlarını getir
        try {
          const settingsResponse = await fetch(`/api/settings?scope=user`);
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json();

            // Kayıtlı e-posta şablonu ayarlarını kullan
            if (settingsData.EMAIL_EXAM_SUBJECT) {
              // Konu şablonunu olduğu gibi kullan
              setEmailSubject(settingsData.EMAIL_EXAM_SUBJECT);
            } else {
              // Varsayılan konu - yer tutucuları kullan
              setEmailSubject(`{EXAM_TITLE} - Sınav Davetiyesi`);
            }

            if (settingsData.EMAIL_EXAM_TEMPLATE) {
              // Şablonu olduğu gibi kullan, dinamik alanları değiştirme
              // Kullanıcı şablonu düzenlerken yer tutucuları görmeli
              setEmailBody(settingsData.EMAIL_EXAM_TEMPLATE);
            } else {
              // Varsayılan içerik - yer tutucuları kullan
              setEmailBody(`Sayın {USER_NAME},

{EXAM_TITLE} sınavına katılmanız için davet edildiniz.

Sınav Kodu: {EXAM_CODE}

Sınava giriş yapmak için aşağıdaki linki kullanabilirsiniz:
{EXAM_LINK}

Saygılarımızla,
Kent Konut A.Ş.`);
            }
          } else {
            // Ayarlar getirilemezse varsayılan değerleri kullan - yer tutucularla
            setEmailSubject(`{EXAM_TITLE} - Sınav Davetiyesi`);
            setEmailBody(`Sayın {USER_NAME},

{EXAM_TITLE} sınavına katılmanız için davet edildiniz.

Sınav Kodu: {EXAM_CODE}

Sınava giriş yapmak için aşağıdaki linki kullanabilirsiniz:
{EXAM_LINK}

Saygılarımızla,
Kent Konut A.Ş.`);
          }
        } catch (error) {
          console.error("Ayarlar yüklenirken hata:", error);
          // Hata durumunda varsayılan değerleri kullan - yer tutucularla
          setEmailSubject(`{EXAM_TITLE} - Sınav Davetiyesi`);
          setEmailBody(`Sayın {USER_NAME},

{EXAM_TITLE} sınavına katılmanız için davet edildiniz.

Sınav Kodu: {EXAM_CODE}

Sınava giriş yapmak için aşağıdaki linki kullanabilirsiniz:
{EXAM_LINK}

Saygılarımızla,
Kent Konut A.Ş.`);
        }
      } catch (error) {
        console.error("Veri yüklenirken hata:", error);
        toast.error("Veri yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.examId]);

  // Kullanıcıları filtrele
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Tümünü seç/kaldır
  function handleSelectAll() {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    // Filtrelenmiş kullanıcıları güncelle
    const updatedFilteredUsers = filteredUsers.map(user => ({
      ...user,
      selected: newSelectAll
    }));

    // Tüm kullanıcıları güncelle
    const updatedUsers = users.map(user => {
      // Eğer kullanıcı filtrelenmiş listede varsa, seçim durumunu güncelle
      const filteredUser = updatedFilteredUsers.find(fu => fu.id === user.id);
      if (filteredUser) {
        return { ...user, selected: filteredUser.selected };
      }
      // Filtrelenmiş listede yoksa, mevcut seçim durumunu koru
      return user;
    });

    setUsers(updatedUsers);
    setFilteredUsers(updatedFilteredUsers);
  }

  // Tek kullanıcı seç/kaldır
  function handleSelectUser(userId: string) {
    // Tüm kullanıcıları güncelle
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, selected: !user.selected } : user
    );

    // Filtrelenmiş kullanıcıları güncelle
    const updatedFilteredUsers = filteredUsers.map(user =>
      user.id === userId ? { ...user, selected: !user.selected } : user
    );

    setUsers(updatedUsers);
    setFilteredUsers(updatedFilteredUsers);

    // Tüm filtrelenmiş kullanıcılar seçili mi kontrol et
    setSelectAll(updatedFilteredUsers.every(user => user.selected));
  }

  // Sınav kodunu kopyala
  function copyAccessCode() {
    if (exam) {
      navigator.clipboard.writeText(exam.access_code);
      toast.success("Sınav kodu panoya kopyalandı");
    }
  }

  // E-posta şablonunu kaydet
  async function saveEmailTemplate() {
    try {
      setSaving(true);

      // Doğrudan kullanıcının girdiği şablonu kaydet
      // Dinamik alanlar zaten yer tutucu olarak girilmiş olmalı
      let templateToSave = emailBody;
      let subjectToSave = emailSubject;

      // Eğer kullanıcı gerçek değerleri girdiyse, bunları yer tutucularla değiştir
      if (exam) {
        // Sınav adını yer tutucuyla değiştir (ancak sadece tam eşleşmelerde)
        if (templateToSave.includes(exam.title)) {
          templateToSave = templateToSave.split(exam.title).join('{EXAM_TITLE}');
        }

        // Sınav kodunu yer tutucuyla değiştir
        if (templateToSave.includes(exam.access_code)) {
          templateToSave = templateToSave.split(exam.access_code).join('{EXAM_CODE}');
        }

        // Sınav linkini yer tutucuyla değiştir
        const examLink = `${appUrl}/exam`;
        if (templateToSave.includes(examLink)) {
          templateToSave = templateToSave.split(examLink).join('{EXAM_LINK}');
        }

        // Konu satırında da sınav adını yer tutucu ile değiştir
        if (subjectToSave.includes(exam.title)) {
          subjectToSave = subjectToSave.split(exam.title).join('{EXAM_TITLE}');
        }
      }

      const response = await fetch(`/api/settings?scope=user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          EMAIL_EXAM_SUBJECT: subjectToSave,
          EMAIL_EXAM_TEMPLATE: templateToSave
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "E-posta şablonu kaydedilirken bir hata oluştu");
      }

      toast.success("E-posta şablonu başarıyla kaydedildi");
      console.log("E-posta şablonu kaydedildi");
    } catch (error) {
      console.error("E-posta şablonu kaydedilirken hata:", error);
      toast.error(`E-posta şablonu kaydedilemedi: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  // E-posta gönder
  async function sendEmails() {
    const selectedUsers = users.filter(user => user.selected);

    if (selectedUsers.length === 0) {
      toast.error("Lütfen en az bir personel seçin");
      return;
    }

    try {
      setSending(true);

      // E-posta gönderirken şablonu otomatik olarak kaydetme işlemini kaldırdık
      // Artık kullanıcı şablonu ayrı bir butonla kaydedebilir

      const response = await fetch("/api/admin/send-exam-invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId: params.examId,
          users: selectedUsers.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email
          })),
          subject: emailSubject,
          body: emailBody
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("E-posta gönderme API hatası:", errorData);
        throw new Error(errorData.error || "E-posta gönderilirken bir hata oluştu");
      }

      const result = await response.json();
      console.log("E-posta gönderme sonucu:", result);

      if (result.testMode) {
        toast.success(`${selectedUsers.length} personele e-posta başarıyla gönderildi (Test Modu)`);
      } else {
        toast.success(`${selectedUsers.length} personele e-posta başarıyla gönderildi`);
      }
    } catch (error) {
      console.error("E-posta gönderilirken hata:", error);
      toast.error(`E-posta gönderilirken bir hata oluştu: ${error.message}`);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Sınav bulunamadı</h2>
              <p className="text-muted-foreground mb-6">
                İstediğiniz sınav bulunamadı veya erişim izniniz yok.
              </p>
              <Button onClick={() => router.push("/admin/exams")}>
                Sınav Listesine Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sınav durumunu kontrol et
  const isExamPublished = exam?.status === "published";

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/exams")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Sınav Listesine Dön
        </Button>
        <h1 className="text-3xl font-bold">{exam.title}</h1>
        <p className="text-muted-foreground">Sınav Paylaşım ve Personel Atama</p>
      </div>

      {!isExamPublished ? (
        // Taslak sınav durumunda gösterilecek içerik
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-amber-600">Sınav Henüz Yayınlanmadı</CardTitle>
            <CardDescription>
              Bu sınav taslak durumunda olduğu için personele e-posta gönderilemez.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
              <h3 className="text-amber-800 font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Önemli Bilgi
              </h3>
              <p className="mt-2 text-amber-700">
                Personele e-posta göndermek için önce sınavı yayınlamanız gerekmektedir.
                Taslak durumdaki sınavlar personel tarafından erişilemez ve "Yanlış sınav kodu" hatası verir.
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium">İzlenecek Adımlar:</h3>
              <ol className="mt-2 space-y-2 list-decimal list-inside">
                <li>Sınav düzenleme sayfasına gidin</li>
                <li>Sınavın içeriğini kontrol edin</li>
                <li>Sınavın durumunu "Yayında" olarak değiştirin</li>
                <li>Değişiklikleri kaydedin</li>
                <li>Bu sayfaya geri dönün ve e-posta gönderme işlemine devam edin</li>
              </ol>
            </div>
          </CardContent>
          <div className="px-6 py-4 border-t flex justify-end space-x-2">
            <Button
              onClick={() => router.push(`/admin/exams/${params.examId}/edit`)}
              className="mr-2"
            >
              Sınavı Düzenle
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/exams/${params.examId}`)}
            >
              Sınav Detaylarına Dön
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sınav Bilgileri</CardTitle>
            <CardDescription>
              Sınav kodu ve paylaşım bilgileri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Sınav Kodu</Label>
                <div className="flex mt-1">
                  <Input
                    value={exam.access_code}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyAccessCode}
                    className="ml-2"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Bu kod ile öğrenciler sınava giriş yapabilir.
                </p>
              </div>

              <div>
                <Label>Sınav Giriş Linki</Label>
                <div className="flex mt-1">
                  <Input
                    value={`${appUrl}/exam`}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const examLink = `${appUrl}/exam`;
                      console.log("[ShareExamPage] Kopyalanan sınav linki:", examLink);
                      navigator.clipboard.writeText(examLink);
                      toast.success("Sınav linki panoya kopyalandı");
                    }}
                    className="ml-2"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Dış erişim URL'si: {appUrl}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>E-posta Ayarları</CardTitle>
            <CardDescription>
              Personele gönderilecek e-posta içeriği
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">E-posta Konusu</Label>
                <Input
                  id="subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Konuda <code>{'{EXAM_TITLE}'}</code> yer tutucusunu kullanabilirsiniz.
                </p>
              </div>
              <div>
                <Label htmlFor="body">E-posta İçeriği</Label>
                <textarea
                  id="body"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full min-h-[200px] p-2 border rounded-md"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Şablonda aşağıdaki yer tutucuları kullanabilirsiniz:
                  <br />
                  <code>{'{EXAM_TITLE}'}</code> - Sınav adı
                  <br />
                  <code>{'{EXAM_CODE}'}</code> - Sınav kodu
                  <br />
                  <code>{'{EXAM_LINK}'}</code> - Sınav giriş linki
                  <br />
                  <code>{'{USER_NAME}'}</code> - Personel adı
                </p>
              </div>
            </div>
          </CardContent>
          <div className="px-6 py-4 border-t flex justify-end">
            <Button
              variant="outline"
              onClick={saveEmailTemplate}
              disabled={saving}
            >
              {saving ? "Kaydediliyor..." : "Şablonu Kaydet"}
            </Button>
          </div>
        </Card>
      </div>

      {isExamPublished ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Personel Listesi</CardTitle>
            <CardDescription>
              E-posta göndermek istediğiniz personeli seçin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="selectAll"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="selectAll">Tümünü Seç</Label>
              </div>

              <div className="relative">
                <Input
                  type="text"
                  placeholder="Ad soyad veya e-posta ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {users.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground empty-state-message">
                Personel bulunamadı
              </p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground empty-state-message">
                Arama kriterine uygun personel bulunamadı
              </p>
            ) : (
              <div className="border rounded-md">
                <div className="grid grid-cols-12 font-medium p-4 border-b">
                  <div className="col-span-1">Seç</div>
                  <div className="col-span-4">Ad Soyad</div>
                  <div className="col-span-7">E-posta</div>
                </div>
                <div className="divide-y max-h-[400px] overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="grid grid-cols-12 p-4 items-center">
                      <div className="col-span-1">
                        <Checkbox
                          checked={user.selected}
                          onCheckedChange={() => handleSelectUser(user.id)}
                        />
                      </div>
                      <div className="col-span-4">{user.name}</div>
                      <div className="col-span-7 truncate">{user.email}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                onClick={sendEmails}
                disabled={sending || users.filter(u => u.selected).length === 0}
              >
                <Mail className="mr-2 h-4 w-4" />
                {sending ? "Gönderiliyor..." : "Seçili Personele E-posta Gönder"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
