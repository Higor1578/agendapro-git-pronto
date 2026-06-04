export const businessTypes = {
  "lava-jato": "Lava jato",
  barbearia: "Barbearia",
  manicure: "Manicure",
  salao: "Salao de beleza"
};

export const planPrices = {
  Essencial: 79,
  Profissional: 149,
  Premium: 249
};

export const initialPlans = [
  { id: "Essencial", name: "Essencial", price: 79, trialDays: 7, storesLimit: 1, bookingsLimit: 120 },
  { id: "Profissional", name: "Profissional", price: 149, trialDays: 14, storesLimit: 3, bookingsLimit: 500 },
  { id: "Premium", name: "Premium", price: 249, trialDays: 30, storesLimit: 10, bookingsLimit: 2000 }
];

export const timeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00"
];

export const defaultSchedule = {
  slotInterval: 60,
  workDays: [1, 2, 3, 4, 5, 6],
  closedDates: ["2026-06-07"],
  startTime: "08:00",
  endTime: "18:00"
};

export const initialBusinesses = [
  {
    id: "brilho-car",
    name: "Brilho Car Lava Jato",
    type: "lava-jato",
    owner: "Marcos",
    plan: "Profissional",
    monthly: 149,
    active: true,
    trialDays: 14,
    schedule: defaultSchedule,
    expenses: [
      { id: "exp-1", name: "Produtos de limpeza", category: "Insumos", amount: 320, date: "2026-06-04" },
      { id: "exp-2", name: "Agua e energia", category: "Operacional", amount: 180, date: "2026-06-04" }
    ],
    opportunities: [
      { id: "opp-1", client: "Joao Pereira", note: "Oferecer plano de lavagem mensal", value: 180, status: "aberta" }
    ],
    professionals: ["Marcos", "Diego", "Paula"],
    services: [
      { name: "Lavagem simples", price: 45, duration: 40 },
      { name: "Lavagem completa + cera", price: 95, duration: 75 },
      { name: "Higienizacao interna", price: 180, duration: 150 }
    ]
  },
  {
    id: "navalha-fina",
    name: "Navalha Fina Barbearia",
    type: "barbearia",
    owner: "Rafael",
    plan: "Essencial",
    monthly: 79,
    active: true,
    trialDays: 7,
    schedule: { ...defaultSchedule, slotInterval: 30, workDays: [2, 3, 4, 5, 6] },
    expenses: [{ id: "exp-3", name: "Pomadas e laminas", category: "Insumos", amount: 140, date: "2026-06-04" }],
    opportunities: [{ id: "opp-2", client: "Bruno Santos", note: "Vender assinatura quinzenal", value: 120, status: "aberta" }],
    professionals: ["Rafael", "Andre", "Lucas"],
    services: [
      { name: "Corte masculino", price: 45, duration: 35 },
      { name: "Barba", price: 35, duration: 30 },
      { name: "Corte + barba", price: 85, duration: 55 }
    ]
  },
  {
    id: "bella-maos",
    name: "Bella Maos Studio",
    type: "manicure",
    owner: "Ana",
    plan: "Premium",
    monthly: 249,
    active: true,
    trialDays: 30,
    schedule: { ...defaultSchedule, slotInterval: 45, workDays: [1, 2, 3, 4, 5] },
    expenses: [{ id: "exp-4", name: "Esmaltes", category: "Insumos", amount: 210, date: "2026-06-04" }],
    opportunities: [{ id: "opp-3", client: "Camila Rocha", note: "Retorno para manutencao em 20 dias", value: 70, status: "aberta" }],
    professionals: ["Ana", "Camila", "Nina"],
    services: [
      { name: "Manicure tradicional", price: 38, duration: 45 },
      { name: "Pedicure", price: 45, duration: 50 },
      { name: "Esmaltacao em gel", price: 70, duration: 60 }
    ]
  },
  {
    id: "luz-beauty",
    name: "Luz Beauty Salao",
    type: "salao",
    owner: "Bianca",
    plan: "Profissional",
    monthly: 149,
    active: false,
    trialDays: 14,
    schedule: { ...defaultSchedule, slotInterval: 60, workDays: [1, 2, 3, 4, 5] },
    expenses: [],
    opportunities: [],
    professionals: ["Bianca", "Priscila", "Joana"],
    services: [
      { name: "Escova", price: 60, duration: 45 },
      { name: "Hidratacao", price: 95, duration: 70 },
      { name: "Coloracao", price: 190, duration: 150 }
    ]
  }
];

export const initialBookings = [
  {
    id: "ag-1",
    client: "Joao Pereira",
    phone: "(11) 99999-1111",
    businessId: "brilho-car",
    service: "Lavagem completa + cera",
    date: "2026-06-04",
    time: "08:30",
    professional: "Marcos",
    status: "confirmado",
    notes: "Carro SUV",
    price: 95,
    duration: 75
  },
  {
    id: "ag-2",
    client: "Camila Rocha",
    phone: "(11) 99999-2222",
    businessId: "bella-maos",
    service: "Esmaltacao em gel",
    date: "2026-06-04",
    time: "09:15",
    professional: "Ana",
    status: "pendente",
    notes: "",
    price: 70,
    duration: 60
  },
  {
    id: "ag-3",
    client: "Bruno Santos",
    phone: "(11) 99999-3333",
    businessId: "navalha-fina",
    service: "Corte + barba",
    date: "2026-06-04",
    time: "10:00",
    professional: "Rafael",
    status: "confirmado",
    notes: "Corte degradado",
    price: 85,
    duration: 55
  },
  {
    id: "ag-4",
    client: "Patricia Lima",
    phone: "(11) 99999-4444",
    businessId: "luz-beauty",
    service: "Hidratacao",
    date: "2026-06-04",
    time: "11:30",
    professional: "Bianca",
    status: "concluido",
    notes: "",
    price: 95,
    duration: 70
  }
];
