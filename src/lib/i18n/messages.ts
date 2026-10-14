export type JdvLocale = "fr" | "en" | "es" | "fil" | "it" | "zh-CN" | "zh-TW" | "pt" | "de" | "ar" | "sw";

export const JDV_LOCALES: { code: JdvLocale; label: string; nativeName: string; dir?: "rtl" | "ltr" }[] = [
  { code: "fr", label: "French", nativeName: "Français" },
  { code: "en", label: "English", nativeName: "English" },
  { code: "es", label: "Spanish", nativeName: "Español" },
  { code: "fil", label: "Filipino", nativeName: "Filipino" },
  { code: "it", label: "Italian", nativeName: "Italiano" },
  { code: "zh-CN", label: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "zh-TW", label: "Chinese (Traditional)", nativeName: "繁體中文" },
  { code: "pt", label: "Portuguese", nativeName: "Português" },
  { code: "de", label: "German", nativeName: "Deutsch" },
  { code: "ar", label: "Arabic", nativeName: "العربية", dir: "rtl" },
  { code: "sw", label: "Swahili", nativeName: "Kiswahili" },
];

export type TranslationKey =
  | "language" | "languageSettings" | "selectLanguage" | "search" | "save" | "cancel"
  | "close" | "back" | "next" | "previous" | "loading" | "error" | "success"
  | "retry" | "refresh" | "filter" | "all" | "status" | "date" | "time"
  | "actions" | "edit" | "delete" | "create" | "add" | "update" | "submit"
  | "confirm" | "yes" | "no" | "name" | "email" | "phone" | "address"
  | "dashboard" | "settings" | "logout" | "login" | "welcome" | "notifications"
  | "clients" | "prospects" | "appointments" | "sales" | "stock" | "warehouse"
  | "agents" | "reports" | "company" | "companies" | "administration" | "help"
  | "noResults" | "requiredField" | "networkError" | "languageSaved" | "fallbackNotice";

// prettier-ignore
const fr: Record<TranslationKey, string> = {
  language:"Langue", languageSettings:"Paramètres de langue", selectLanguage:"Choisir une langue",
  search:"Rechercher", save:"Enregistrer", cancel:"Annuler", close:"Fermer", back:"Retour",
  next:"Suivant", previous:"Précédent", loading:"Chargement…", error:"Erreur", success:"Succès",
  retry:"Réessayer", refresh:"Actualiser", filter:"Filtrer", all:"Tout", status:"Statut",
  date:"Date", time:"Heure", actions:"Actions", edit:"Modifier", delete:"Supprimer",
  create:"Créer", add:"Ajouter", update:"Mettre à jour", submit:"Soumettre", confirm:"Confirmer",
  yes:"Oui", no:"Non", name:"Nom", email:"E-mail", phone:"Téléphone", address:"Adresse",
  dashboard:"Tableau de bord", settings:"Paramètres", logout:"Déconnexion", login:"Connexion",
  welcome:"Bienvenue", notifications:"Notifications", clients:"Clients", prospects:"Prospects",
  appointments:"Rendez-vous", sales:"Ventes", stock:"Stock", warehouse:"Entrepôt", agents:"Agents",
  reports:"Rapports", company:"Entreprise", companies:"Entreprises", administration:"Administration",
  help:"Aide", noResults:"Aucun résultat", requiredField:"Ce champ est obligatoire",
  networkError:"Erreur de connexion. Vérifiez votre réseau puis réessayez.",
  languageSaved:"Langue enregistrée.", fallbackNotice:"Certains textes restent dans la langue par défaut."
};
// prettier-ignore
const en: Record<TranslationKey, string> = {
  language:"Language", languageSettings:"Language settings", selectLanguage:"Choose a language",
  search:"Search", save:"Save", cancel:"Cancel", close:"Close", back:"Back", next:"Next",
  previous:"Previous", loading:"Loading…", error:"Error", success:"Success", retry:"Try again",
  refresh:"Refresh", filter:"Filter", all:"All", status:"Status", date:"Date", time:"Time",
  actions:"Actions", edit:"Edit", delete:"Delete", create:"Create", add:"Add", update:"Update",
  submit:"Submit", confirm:"Confirm", yes:"Yes", no:"No", name:"Name", email:"Email", phone:"Phone",
  address:"Address", dashboard:"Dashboard", settings:"Settings", logout:"Log out", login:"Log in",
  welcome:"Welcome", notifications:"Notifications", clients:"Customers", prospects:"Prospects",
  appointments:"Appointments", sales:"Sales", stock:"Inventory", warehouse:"Warehouse", agents:"Agents",
  reports:"Reports", company:"Company", companies:"Companies", administration:"Administration",
  help:"Help", noResults:"No results", requiredField:"This field is required",
  networkError:"Connection error. Check your network and try again.",
  languageSaved:"Language saved.", fallbackNotice:"Some text remains in the default language."
};
// prettier-ignore
const es: Record<TranslationKey, string> = {
  language:"Idioma", languageSettings:"Configuración de idioma", selectLanguage:"Elegir un idioma",
  search:"Buscar", save:"Guardar", cancel:"Cancelar", close:"Cerrar", back:"Volver", next:"Siguiente",
  previous:"Anterior", loading:"Cargando…", error:"Error", success:"Éxito", retry:"Reintentar",
  refresh:"Actualizar", filter:"Filtrar", all:"Todo", status:"Estado", date:"Fecha", time:"Hora",
  actions:"Acciones", edit:"Editar", delete:"Eliminar", create:"Crear", add:"Añadir", update:"Actualizar",
  submit:"Enviar", confirm:"Confirmar", yes:"Sí", no:"No", name:"Nombre", email:"Correo electrónico",
  phone:"Teléfono", address:"Dirección", dashboard:"Panel", settings:"Configuración", logout:"Cerrar sesión",
  login:"Iniciar sesión", welcome:"Bienvenido", notifications:"Notificaciones", clients:"Clientes",
  prospects:"Prospectos", appointments:"Citas", sales:"Ventas", stock:"Inventario", warehouse:"Almacén",
  agents:"Agentes", reports:"Informes", company:"Empresa", companies:"Empresas",
  administration:"Administración", help:"Ayuda", noResults:"Sin resultados",
  requiredField:"Este campo es obligatorio", networkError:"Error de conexión. Compruebe la red e inténtelo de nuevo.",
  languageSaved:"Idioma guardado.", fallbackNotice:"Algunos textos permanecen en el idioma predeterminado."
};
// prettier-ignore
const it: Record<TranslationKey, string> = {
  language:"Lingua", languageSettings:"Impostazioni lingua", selectLanguage:"Scegli una lingua",
  search:"Cerca", save:"Salva", cancel:"Annulla", close:"Chiudi", back:"Indietro", next:"Avanti",
  previous:"Precedente", loading:"Caricamento…", error:"Errore", success:"Operazione riuscita",
  retry:"Riprova", refresh:"Aggiorna", filter:"Filtra", all:"Tutto", status:"Stato", date:"Data",
  time:"Ora", actions:"Azioni", edit:"Modifica", delete:"Elimina", create:"Crea", add:"Aggiungi",
  update:"Aggiorna", submit:"Invia", confirm:"Conferma", yes:"Sì", no:"No", name:"Nome",
  email:"E-mail", phone:"Telefono", address:"Indirizzo", dashboard:"Dashboard", settings:"Impostazioni",
  logout:"Esci", login:"Accedi", welcome:"Benvenuto", notifications:"Notifiche", clients:"Clienti",
  prospects:"Potenziali clienti", appointments:"Appuntamenti", sales:"Vendite", stock:"Scorte",
  warehouse:"Magazzino", agents:"Agenti", reports:"Rapporti", company:"Azienda", companies:"Aziende",
  administration:"Amministrazione", help:"Aiuto", noResults:"Nessun risultato",
  requiredField:"Questo campo è obbligatorio", networkError:"Errore di connessione. Controlla la rete e riprova.",
  languageSaved:"Lingua salvata.", fallbackNotice:"Alcuni testi restano nella lingua predefinita."
};
// prettier-ignore
const fil: Record<TranslationKey, string> = {
  language:"Wika", languageSettings:"Mga setting ng wika", selectLanguage:"Pumili ng wika",
  search:"Maghanap", save:"I-save", cancel:"Kanselahin", close:"Isara", back:"Bumalik", next:"Susunod",
  previous:"Nakaraan", loading:"Naglo-load…", error:"Error", success:"Tagumpay", retry:"Subukan muli",
  refresh:"I-refresh", filter:"Salain", all:"Lahat", status:"Katayuan", date:"Petsa", time:"Oras",
  actions:"Mga aksyon", edit:"I-edit", delete:"Tanggalin", create:"Gumawa", add:"Idagdag",
  update:"I-update", submit:"Isumite", confirm:"Kumpirmahin", yes:"Oo", no:"Hindi", name:"Pangalan",
  email:"Email", phone:"Telepono", address:"Address", dashboard:"Dashboard", settings:"Mga setting",
  logout:"Mag-log out", login:"Mag-log in", welcome:"Maligayang pagdating", notifications:"Mga abiso",
  clients:"Mga kliyente", prospects:"Mga prospect", appointments:"Mga appointment", sales:"Benta",
  stock:"Imbentaryo", warehouse:"Bodega", agents:"Mga ahente", reports:"Mga ulat", company:"Kumpanya",
  companies:"Mga kumpanya", administration:"Administrasyon", help:"Tulong", noResults:"Walang resulta",
  requiredField:"Kinakailangan ang field na ito", networkError:"Error sa koneksyon. Suriin ang network at subukan muli.",
  languageSaved:"Na-save ang wika.", fallbackNotice:"May ilang teksto na nasa default na wika pa rin."
};
const itFallback = { ...en };
// prettier-ignore
const pt: Record<TranslationKey, string> = { ...en, language:"Idioma", languageSettings:"Configurações de idioma", selectLanguage:"Escolher um idioma", search:"Pesquisar", save:"Guardar", cancel:"Cancelar", close:"Fechar", back:"Voltar", next:"Seguinte", previous:"Anterior", loading:"A carregar…", error:"Erro", success:"Sucesso", retry:"Tentar novamente", refresh:"Atualizar", filter:"Filtrar", all:"Todos", status:"Estado", date:"Data", time:"Hora", actions:"Ações", edit:"Editar", delete:"Eliminar", create:"Criar", add:"Adicionar", update:"Atualizar", submit:"Enviar", confirm:"Confirmar", yes:"Sim", no:"Não", name:"Nome", email:"E-mail", phone:"Telefone", address:"Morada", dashboard:"Painel", settings:"Definições", logout:"Terminar sessão", login:"Iniciar sessão", welcome:"Bem-vindo", notifications:"Notificações", clients:"Clientes", prospects:"Potenciais clientes", appointments:"Compromissos", sales:"Vendas", stock:"Stock", warehouse:"Armazém", agents:"Agentes", reports:"Relatórios", company:"Empresa", companies:"Empresas", administration:"Administração", help:"Ajuda", noResults:"Sem resultados", requiredField:"Este campo é obrigatório", networkError:"Erro de ligação. Verifique a rede e tente novamente.", languageSaved:"Idioma guardado." };
// prettier-ignore
const de: Record<TranslationKey, string> = { ...en, language:"Sprache", languageSettings:"Spracheinstellungen", selectLanguage:"Sprache auswählen", search:"Suchen", save:"Speichern", cancel:"Abbrechen", close:"Schließen", back:"Zurück", next:"Weiter", previous:"Zurück", loading:"Wird geladen…", error:"Fehler", success:"Erfolg", retry:"Erneut versuchen", refresh:"Aktualisieren", filter:"Filtern", all:"Alle", status:"Status", date:"Datum", time:"Uhrzeit", actions:"Aktionen", edit:"Bearbeiten", delete:"Löschen", create:"Erstellen", add:"Hinzufügen", update:"Aktualisieren", submit:"Absenden", confirm:"Bestätigen", yes:"Ja", no:"Nein", name:"Name", email:"E-Mail", phone:"Telefon", address:"Adresse", dashboard:"Dashboard", settings:"Einstellungen", logout:"Abmelden", login:"Anmelden", welcome:"Willkommen", notifications:"Benachrichtigungen", clients:"Kunden", prospects:"Interessenten", appointments:"Termine", sales:"Verkäufe", stock:"Lagerbestand", warehouse:"Lager", agents:"Mitarbeiter", reports:"Berichte", company:"Unternehmen", companies:"Unternehmen", administration:"Administration", help:"Hilfe", noResults:"Keine Ergebnisse", requiredField:"Dieses Feld ist erforderlich", networkError:"Verbindungsfehler. Prüfen Sie Ihr Netzwerk und versuchen Sie es erneut.", languageSaved:"Sprache gespeichert." };
// prettier-ignore
const zhCN: Record<TranslationKey, string> = { ...en, language:"语言", languageSettings:"语言设置", selectLanguage:"选择语言", search:"搜索", save:"保存", cancel:"取消", close:"关闭", back:"返回", next:"下一步", previous:"上一步", loading:"加载中…", error:"错误", success:"成功", retry:"重试", refresh:"刷新", filter:"筛选", all:"全部", status:"状态", date:"日期", time:"时间", actions:"操作", edit:"编辑", delete:"删除", create:"创建", add:"添加", update:"更新", submit:"提交", confirm:"确认", yes:"是", no:"否", name:"姓名", email:"电子邮件", phone:"电话", address:"地址", dashboard:"仪表板", settings:"设置", logout:"退出登录", login:"登录", welcome:"欢迎", notifications:"通知", clients:"客户", prospects:"潜在客户", appointments:"预约", sales:"销售", stock:"库存", warehouse:"仓库", agents:"代理", reports:"报告", company:"公司", companies:"公司", administration:"管理", help:"帮助", noResults:"没有结果", requiredField:"此字段为必填项", networkError:"连接错误。请检查网络后重试。", languageSaved:"语言已保存。" };
// prettier-ignore
const zhTW: Record<TranslationKey, string> = { ...zhCN, language:"語言", languageSettings:"語言設定", selectLanguage:"選擇語言", search:"搜尋", save:"儲存", cancel:"取消", close:"關閉", back:"返回", next:"下一步", previous:"上一步", loading:"載入中…", error:"錯誤", success:"成功", retry:"重試", refresh:"重新整理", filter:"篩選", all:"全部", status:"狀態", date:"日期", time:"時間", actions:"操作", edit:"編輯", delete:"刪除", create:"建立", add:"新增", update:"更新", submit:"提交", confirm:"確認", yes:"是", no:"否", name:"姓名", email:"電子郵件", phone:"電話", address:"地址", dashboard:"儀表板", settings:"設定", logout:"登出", login:"登入", welcome:"歡迎", notifications:"通知", clients:"客戶", prospects:"潛在客戶", appointments:"預約", sales:"銷售", stock:"庫存", warehouse:"倉庫", agents:"代理", reports:"報告", company:"公司", companies:"公司", administration:"管理", help:"幫助", noResults:"沒有結果", requiredField:"此欄位為必填", networkError:"連線錯誤。請檢查網路後重試。", languageSaved:"語言已儲存。" };
// prettier-ignore
const ar: Record<TranslationKey, string> = { ...en, language:"اللغة", languageSettings:"إعدادات اللغة", selectLanguage:"اختر لغة", search:"بحث", save:"حفظ", cancel:"إلغاء", close:"إغلاق", back:"رجوع", next:"التالي", previous:"السابق", loading:"جارٍ التحميل…", error:"خطأ", success:"نجاح", retry:"إعادة المحاولة", refresh:"تحديث", filter:"تصفية", all:"الكل", status:"الحالة", date:"التاريخ", time:"الوقت", actions:"الإجراءات", edit:"تعديل", delete:"حذف", create:"إنشاء", add:"إضافة", update:"تحديث", submit:"إرسال", confirm:"تأكيد", yes:"نعم", no:"لا", name:"الاسم", email:"البريد الإلكتروني", phone:"الهاتف", address:"العنوان", dashboard:"لوحة التحكم", settings:"الإعدادات", logout:"تسجيل الخروج", login:"تسجيل الدخول", welcome:"مرحبًا", notifications:"الإشعارات", clients:"العملاء", prospects:"العملاء المحتملون", appointments:"المواعيد", sales:"المبيعات", stock:"المخزون", warehouse:"المستودع", agents:"الوكلاء", reports:"التقارير", company:"الشركة", companies:"الشركات", administration:"الإدارة", help:"المساعدة", noResults:"لا توجد نتائج", requiredField:"هذا الحقل مطلوب", networkError:"خطأ في الاتصال. تحقق من الشبكة وحاول مرة أخرى.", languageSaved:"تم حفظ اللغة." };
// prettier-ignore
const sw: Record<TranslationKey, string> = { ...en, language:"Lugha", languageSettings:"Mipangilio ya lugha", selectLanguage:"Chagua lugha", search:"Tafuta", save:"Hifadhi", cancel:"Ghairi", close:"Funga", back:"Rudi", next:"Inayofuata", previous:"Iliyotangulia", loading:"Inapakia…", error:"Hitilafu", success:"Imefanikiwa", retry:"Jaribu tena", refresh:"Onyesha upya", filter:"Chuja", all:"Zote", status:"Hali", date:"Tarehe", time:"Muda", actions:"Vitendo", edit:"Hariri", delete:"Futa", create:"Unda", add:"Ongeza", update:"Sasisha", submit:"Wasilisha", confirm:"Thibitisha", yes:"Ndiyo", no:"Hapana", name:"Jina", email:"Barua pepe", phone:"Simu", address:"Anwani", dashboard:"Dashibodi", settings:"Mipangilio", logout:"Ondoka", login:"Ingia", welcome:"Karibu", notifications:"Arifa", clients:"Wateja", prospects:"Wateja watarajiwa", appointments:"Miadi", sales:"Mauzo", stock:"Hifadhi", warehouse:"Ghala", agents:"Mawakala", reports:"Ripoti", company:"Kampuni", companies:"Makampuni", administration:"Usimamizi", help:"Msaada", noResults:"Hakuna matokeo", requiredField:"Sehemu hii inahitajika", networkError:"Hitilafu ya muunganisho. Angalia mtandao na ujaribu tena.", languageSaved:"Lugha imehifadhiwa." };

// prettier-ignore
export const messages: Record<JdvLocale, Record<TranslationKey, string>> = {
  fr, en, es, fil, it, "zh-CN": zhCN, "zh-TW": zhTW, pt, de, ar, sw
};
