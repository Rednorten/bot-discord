import 'dotenv/config';
import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Client, EmbedBuilder, Events,
  GatewayIntentBits, ModalBuilder, OverwriteType, PermissionFlagsBits, REST, Routes,
  SlashCommandBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle, WebhookClient,
} from 'discord.js';
import { google } from 'googleapis';

const PANEL_BUTTON = 'member_panel:add';
const DEPARTURE_RESIGN_BUTTON = 'departure_panel:open:demisie';
const DEPARTURE_OUT_BUTTON = 'departure_panel:open:out';
const LEAVE_PANEL_BUTTON = 'leave_panel:open';
const COOLDOWN_CERT_BUTTON_PREFIX = 'cooldown:cert:';
const COOLDOWN_ACTION_PREFIX = 'cooldown:action:';
const INSTRUCTOR_PANEL_CERT_PREFIX = 'instructor-panel:cert:';
const INSTRUCTOR_PANEL_ACTION_PREFIX = 'instructor-panel:action:';
const UPDOWN_PANEL_ACTION_PREFIX = 'updown:action:';
const LEAVE_APPROVE_BUTTON = 'leave:approve';
const LEAVE_REJECT_BUTTON = 'leave:reject';
const ACCEPT_BUTTON = 'hr:accept';
const REJECT_BUTTON = 'hr:reject';
const ASSIGN_PREFIX = 'hr:assign:';
const HR_CHANNEL_NAME = process.env.HR_REVIEW_CHANNEL_NAME || 'cereri-membri-hr';
const DEPARTURE_OUT_ROLE_DEFAULT = '1513782489624346661';
const RANK_RANGES = {
  Cadet: [241, 338],
  Agent: [141, 239],
  'Agent-Principal': [90, 139],
  'Agent-Sef-Principal': [35, 88],
};
const POLICE_GRADE_ROW_RANGES = {
  ...RANK_RANGES,
  Inspector: [22, 33],
  'Sub-Comisar': [17, 20],
  Comisar: [13, 15],
  'Comisar-Șef': [10, 11],
  'Chestor General': [7, 8],
};
const RANK_ROLE_SETTINGS = {
  Cadet: 'DISCORD_ROLE_CADET_ID',
  Agent: 'DISCORD_ROLE_AGENT_ID',
  'Agent-Principal': 'DISCORD_ROLE_AGENT_PRINCIPAL_ID',
  'Agent-Sef-Principal': 'DISCORD_ROLE_AGENT_SEF_PRINCIPAL_ID',
};
const AUTO_ADMISSION_EXTRA_ROLE_IDS = [
  '1516853816425844849',
  '1513782489615962169',
  '1513782489615962170',
];
const UPDOWN_ROLE_SETTINGS = {
  Cadet: RANK_ROLE_SETTINGS.Cadet,
  Agent: RANK_ROLE_SETTINGS.Agent,
  'Agent Principal': RANK_ROLE_SETTINGS['Agent-Principal'],
  'Agent Șef Principal': RANK_ROLE_SETTINGS['Agent-Sef-Principal'],
  Inspector: 'DISCORD_ROLE_INSPECTOR_ID',
  'Sub-Comisar': 'DISCORD_ROLE_SUB_COMISAR_ID',
  Comisar: 'DISCORD_ROLE_COMISAR_ID',
  'Comisar-Șef': 'DISCORD_ROLE_COMISAR_SEF_ID',
  'Chestor General': 'DISCORD_ROLE_CHESTOR_GENERAL_ID',
};
const UPDOWN_RANK_ORDER = [
  'Cadet', 'Agent', 'Agent Principal', 'Agent Șef Principal', 'Inspector',
  'Sub-Comisar', 'Comisar', 'Comisar-Șef', 'Chestor General',
];
const UPDOWN_BONUS_ROLES = [
  { threshold: 'Inspector', roleSetting: 'DISCORD_ROLE_SUPERVIZOR_ID', label: 'SUPERVIZOR' },
  { threshold: 'Sub-Comisar', roleSetting: 'UPDOWN_MANAGEMENT_ROLE_ID', label: 'CONDUCERE' },
];
const UPDOWN_COLUMNS = {
  all: [1, 3, 7, 10, 11, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24],
  agentPrincipal: [1, 3, 7, 10, 11, 13, 14, 15, 16, 18, 20, 21, 22, 23, 24],
  agent: [1, 3, 7, 10, 11, 13, 14, 18, 20, 21, 22, 23, 24],
};
const UPDOWN_STEPS = {
  up: [
    { source: [241, 338], destination: [141, 239], grade: 'Agent', fromGrade: 'Cadet', columns: UPDOWN_COLUMNS.agent },
    { source: [141, 239], destination: [90, 139], grade: 'Agent Principal', fromGrade: 'Agent', columns: UPDOWN_COLUMNS.agentPrincipal },
    { source: [90, 139], destination: [35, 88], grade: 'Agent Șef Principal', fromGrade: 'Agent Principal', columns: UPDOWN_COLUMNS.all },
    { source: [35, 88], destination: [22, 33], grade: 'Inspector', fromGrade: 'Agent Șef Principal', columns: UPDOWN_COLUMNS.all },
    { source: [22, 33], destination: [17, 20], grade: 'Sub-Comisar', fromGrade: 'Inspector', columns: UPDOWN_COLUMNS.all },
    { source: [17, 20], destination: [13, 15], grade: 'Comisar', fromGrade: 'Sub-Comisar', columns: UPDOWN_COLUMNS.all },
    { source: [13, 15], destination: [10, 11], grade: 'Comisar-Șef', fromGrade: 'Comisar', columns: UPDOWN_COLUMNS.all },
    { source: [10, 11], destination: [7, 8], grade: 'Chestor General', fromGrade: 'Comisar-Șef', columns: UPDOWN_COLUMNS.all },
  ],
  down: [
    { source: [7, 8], destination: [10, 11], grade: 'Comisar-Șef', fromGrade: 'Chestor General', columns: UPDOWN_COLUMNS.all },
    { source: [10, 11], destination: [13, 15], grade: 'Comisar', fromGrade: 'Comisar-Șef', columns: UPDOWN_COLUMNS.all },
    { source: [13, 15], destination: [17, 20], grade: 'Sub-Comisar', fromGrade: 'Comisar', columns: UPDOWN_COLUMNS.all },
    { source: [17, 20], destination: [22, 33], grade: 'Inspector', fromGrade: 'Sub-Comisar', columns: UPDOWN_COLUMNS.all },
    { source: [22, 33], destination: [35, 88], grade: 'Agent Șef Principal', fromGrade: 'Inspector', columns: UPDOWN_COLUMNS.all },
    { source: [35, 88], destination: [90, 139], grade: 'Agent Principal', fromGrade: 'Agent Șef Principal', columns: UPDOWN_COLUMNS.all },
    { source: [90, 139], destination: [141, 239], grade: 'Agent', fromGrade: 'Agent Principal', columns: UPDOWN_COLUMNS.agentPrincipal },
    { source: [141, 239], destination: [241, 338], grade: 'Cadet', fromGrade: 'Agent', columns: UPDOWN_COLUMNS.agent },
  ],
};
const INSTRUCTOR_CERTIFICATES = {
  radio: { label: 'INSTRUCTOR RADIO', startColumn: 'B', endColumn: 'E', headerRow: 2, labelsRow: 3, firstDataRow: 4, lastDataRow: 19, idColumn: 'B', callsignColumn: 'C', nameColumn: 'D', discordColumn: 'E', roleSetting: 'DISCORD_INSTRUCTOR_RADIO_ROLE_ID' },
  mdt: { label: 'INSTRUCTOR MDT', startColumn: 'G', endColumn: 'J', headerRow: 2, labelsRow: 3, firstDataRow: 4, lastDataRow: 19, idColumn: 'G', callsignColumn: 'H', nameColumn: 'I', discordColumn: 'J', roleSetting: 'DISCORD_INSTRUCTOR_MDT_ROLE_ID' },
  tester_pd: { label: 'Tester PD', startColumn: 'L', endColumn: 'O', headerRow: 2, labelsRow: 3, firstDataRow: 4, lastDataRow: 19, idColumn: 'L', callsignColumn: 'M', nameColumn: 'N', discordColumn: 'O', roleSetting: 'DISCORD_INSTRUCTOR_TESTER_ROLE_ID' },
  hr: { label: 'Human Resources', startColumn: 'Q', endColumn: 'T', headerRow: 2, labelsRow: 3, firstDataRow: 4, lastDataRow: 19, idColumn: 'Q', callsignColumn: 'R', nameColumn: 'S', discordColumn: 'T', roleSetting: 'DISCORD_INSTRUCTOR_HR_ROLE_ID' },
  moto: { label: 'INSTRUCTOR MOTO', startColumn: 'B', endColumn: 'E', headerRow: 21, labelsRow: 22, firstDataRow: 23, lastDataRow: 32, idColumn: 'B', callsignColumn: 'C', nameColumn: 'D', discordColumn: 'E', roleSetting: 'DISCORD_INSTRUCTOR_MOTO_ROLE_ID', sheetTitle: 'INSTRUCTOR MOTO' },
  heli: { label: 'INSTRUCTOR PILOT', startColumn: 'G', endColumn: 'J', headerRow: 21, labelsRow: 22, firstDataRow: 23, lastDataRow: 32, idColumn: 'G', callsignColumn: 'H', nameColumn: 'I', discordColumn: 'J', roleSetting: 'DISCORD_INSTRUCTOR_HELI_ROLE_ID', sheetTitle: 'INSTRUCTOR PILOT' },
  hs: { label: 'INSTRUCTOR HS', startColumn: 'L', endColumn: 'O', headerRow: 21, labelsRow: 22, firstDataRow: 23, lastDataRow: 32, idColumn: 'L', callsignColumn: 'M', nameColumn: 'N', discordColumn: 'O', roleSetting: 'DISCORD_INSTRUCTOR_HS_ROLE_ID', sheetTitle: 'INSTRUCTOR HS' },
};
const REINTEGRATION_SHEET_NAME = 'Reintegrare';
const SANCTIONS_SHEET_NAME = 'Evidenta Cooldown / Interdictii';
const INSTRUCTOR_EXAM_CHANNEL_ID = '1542197443569918096';
const INSTRUCTOR_EXAM_CERTIFICATES = {
  radio: { label: 'RADIO', column: 13 },
  mdt: { label: 'MDT', column: 14 },
  moto: { label: 'MOTO', column: 15 },
  pilot: { label: 'PILOT', column: 16 },
  hs: { label: 'HS', column: 17 },
};
const SANCTION_CERTIFICATES = {
  radio: { label: 'RADIO', callsignColumn: 'B', dateColumn: 'E', colorColumn: 13, roleSetting: 'DISCORD_INSTRUCTOR_RADIO_ROLE_ID' },
  mdt: { label: 'MDT', callsignColumn: 'G', dateColumn: 'J', colorColumn: 14, roleSetting: 'DISCORD_INSTRUCTOR_MDT_ROLE_ID' },
  moto: { label: 'MOTO', callsignColumn: 'L', dateColumn: 'O', colorColumn: 15, roleSetting: 'DISCORD_INSTRUCTOR_MOTO_ROLE_ID' },
  pilot: { label: 'PILOT', callsignColumn: 'Q', dateColumn: 'T', colorColumn: 16, roleSetting: 'DISCORD_INSTRUCTOR_HELI_ROLE_ID' },
  hs: { label: 'HS', callsignColumn: 'V', dateColumn: 'Y', colorColumn: 17, roleSetting: 'DISCORD_INSTRUCTOR_HS_ROLE_ID' },
};
const lockedApplications = new Set();
const lockedUpDownMembers = new Set();
let sanctionExpirySweepRunning = false;

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Lipsește setarea ${name} din .env`);
  return value;
};
const quoteTab = (tab) => `'${tab.replaceAll("'", "''")}'`;

function roleIds(setting) {
  return (process.env[setting] ?? '').split(',').map((value) => value.trim()).filter(Boolean);
}

function hasAnyRole(interaction, ids) {
  return ids.length > 0 && interaction.member?.roles?.cache?.some((role) => ids.includes(role.id));
}

function canSubmit(interaction) {
  const ids = roleIds('PANEL_ALLOWED_ROLE_IDS');
  return ids.length === 0 || hasAnyRole(interaction, ids);
}

function canReview(interaction) {
  return hasAnyRole(interaction, roleIds('HR_REVIEW_ROLE_IDS'));
}

function departureOutRoleId() {
  return process.env.DEPARTURE_OUT_ROLE_ID?.trim()
    || process.env.DEPARTURE_APPROVER_ROLE_ID?.trim()
    || DEPARTURE_OUT_ROLE_DEFAULT;
}

function canSubmitOut(interaction) {
  return hasAnyRole(interaction, [departureOutRoleId()]);
}

function isReviewChannel(interaction) {
  const configuredId = process.env.HR_REVIEW_CHANNEL_ID?.trim();
  return configuredId
    ? interaction.channelId === configuredId
    : interaction.channel?.name === HR_CHANNEL_NAME;
}

function makeInput(id, label, placeholder, requiredField = true, value, maxLength = 80, style = TextInputStyle.Short) {
  const input = new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(style)
    .setPlaceholder(placeholder).setRequired(requiredField).setMaxLength(maxLength);
  if (value !== undefined) input.setValue(value);
  return input;
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot conectat ca ${readyClient.user.tag}`);
  console.log(`Ascult rezultate certificate în canalul Discord ${INSTRUCTOR_EXAM_CHANNEL_ID}.`);
});
client.once(Events.ClientReady, () => {
  void expireSanctionCooldowns();
  const timer = setInterval(() => void expireSanctionCooldowns(), 5 * 60 * 1000);
  timer.unref();
});

async function ensureReviewChannel(guild) {
  const configuredId = process.env.HR_REVIEW_CHANNEL_ID?.trim();
  if (configuredId) {
    const channel = await guild.channels.fetch(configuredId).catch(() => null);
    if (!channel?.isTextBased()) throw new Error('HR_REVIEW_CHANNEL_ID nu indică un canal text din server.');
    return channel;
  }
  const existing = guild.channels.cache.find((channel) => channel.name === HR_CHANNEL_NAME && channel.type === ChannelType.GuildText);
  if (existing) {
    return existing;
  }

  const hrRoles = roleIds('HR_REVIEW_ROLE_IDS');
  if (!hrRoles.length) throw new Error('Completează HR_REVIEW_ROLE_IDS cu ID-ul rolului HR.');
  const botMember = guild.members.me;
  if (!botMember?.permissions.has(PermissionFlagsBits.ManageChannels)
      || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new Error('Pentru crearea automată a canalului privat, botul are nevoie de Manage Channels și Manage Roles.');
  }

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    ...hrRoles.map((id) => ({
      id, type: OverwriteType.Role,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
    })),
    {
      id: client.user.id, type: OverwriteType.Member,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles],
    },
  ];
  return guild.channels.create({
    name: HR_CHANNEL_NAME,
    type: ChannelType.GuildText,
    topic: 'Cereri de înscriere în așteptarea deciziei HR.',
    permissionOverwrites: overwrites,
    reason: 'Canal privat pentru panelul de înscriere membri',
  });
}

function panelEmbed() {
  return new EmbedBuilder()
    .setColor(0x172554)
    .setAuthor({ name: 'POLIȚIA  •  PORTAL DE ÎNSCRIERE' })
    .setTitle('📋  ÎNSCRIERE ÎN DEPARTAMENT')
    .setDescription('Începe înscrierea completând formularul de mai jos. Cererea va fi trimisă echipei HR.')
    .addFields(
      { name: '📝  DATE PENTRU FORMULAR', value: 'ID in-game\nNume și prenume\nSecția\nDiscord ID', inline: true },
      { name: '🤝  REINTEGRARE', value: 'Menționează dacă ai o reintegrare valabilă. HR va verifica cererea și gradul.', inline: true },
    )
    .setFooter({ text: 'POLIȚIA • Completează toate datele cu atenție' });
}

function departurePanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x7f1d1d)
    .setAuthor({ name: 'POLIȚIA  •  EVIDENȚA PERSONALULUI' })
    .setTitle('📤  DEMISIE / OUT')
    .setDescription('Selectează opțiunea potrivită și completează formularul care se deschide.')
    .addFields(
      { name: '📝  DEMISIE', value: 'Disponibilă tuturor. Completează doar ID-ul in-game.', inline: true },
      { name: '🚨  OUT', value: `Acces: <@&${departureOutRoleId()}>\nSunt necesare motivul și linkul filmării.`, inline: true },
    )
    .setFooter({ text: 'POLIȚIA • Verifică datele înainte de trimitere' });
}

function leavePanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x065f46)
    .setAuthor({ name: 'POLIȚIA  •  CERERI DE CONCEDIU' })
    .setTitle('🌴  SOLICITĂ CONCEDIU')
    .setDescription('Completează formularul cu informațiile și perioada concediului.')
    .addFields(
      { name: '📝  PREGĂTEȘTE', value: 'ID in-game\nNume și prenume\nCallsign\nPerioada\nMotivul', inline: true },
      { name: '📨  DUPĂ TRIMITERE', value: 'Cererea ajunge la HR pentru verificare și decizie.', inline: true },
    )
    .setFooter({ text: 'POLIȚIA • Introdu perioada completă a concediului' });
}

function cooldownPanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x1d4ed8)
    .setAuthor({ name: 'POLIȚIA  •  MANAGEMENT CERTIFICATE' })
    .setTitle('⏳  COOLDOWN / INTERDICȚII')
    .setDescription('Selectează certificatul pentru care vrei să faci o modificare.')
    .addFields({ name: '🔧  ACȚIUNI DISPONIBILE', value: 'Adaugă sau scoate un cooldown ori o interdicție.', inline: false })
    .setFooter({ text: 'POLIȚIA • Selectează certificatul pentru a continua' });
}

function cooldownPanelButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`${COOLDOWN_CERT_BUTTON_PREFIX}radio`).setLabel('📻 RADIO').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`${COOLDOWN_CERT_BUTTON_PREFIX}mdt`).setLabel('💻 MDT').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`${COOLDOWN_CERT_BUTTON_PREFIX}moto`).setLabel('🏍️ MOTO').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`${COOLDOWN_CERT_BUTTON_PREFIX}pilot`).setLabel('🚁 PILOT').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`${COOLDOWN_CERT_BUTTON_PREFIX}hs`).setLabel('🚘 HS').setStyle(ButtonStyle.Primary),
  );
}

function instructorPanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x1e3a8a)
    .setAuthor({ name: 'POLIȚIA  •  MANAGEMENT INSTRUCTORI' })
    .setTitle('🎖️  ADAUGĂ INSTRUCTOR')
    .setDescription('Alege certificatul.');
}

function instructorPanelButtons() {
  const certificates = Object.entries(INSTRUCTOR_CERTIFICATES);
  const icons = { radio: '📻', mdt: '💻', tester_pd: '🧪', hr: '👥', moto: '🏍️', heli: '🚁', hs: '🚘' };
  return [0, 1].map((groupIndex) => new ActionRowBuilder().addComponents(
    ...certificates.slice(groupIndex * 4, groupIndex * 4 + 4).map(([key, certificate]) =>
      new ButtonBuilder()
        .setCustomId(`${INSTRUCTOR_PANEL_CERT_PREFIX}${key}`)
        .setLabel(`${icons[key]} ${certificate.label.toLocaleUpperCase('ro')}`)
        .setStyle(ButtonStyle.Primary)),
  ));
}

function upDownPanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x243b64)
    .setAuthor({ name: 'POLIȚIA  •  MANAGEMENT PERSONAL' })
    .setTitle('📊  UP / DOWN')
    .setDescription('Alege acțiunea și introdu ID-ul in-game al membrului.')
    .addFields(
      { name: '⬆️  UP', value: 'Mută membrul la următorul grad.', inline: true },
      { name: '⬇️  DOWN', value: 'Mută membrul la gradul anterior.', inline: true },
    )
    .setFooter({ text: 'Acces rezervat rolului Conducere' });
}

function upDownPanelButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`${UPDOWN_PANEL_ACTION_PREFIX}up`).setLabel('⬆️  UP').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`${UPDOWN_PANEL_ACTION_PREFIX}down`).setLabel('⬇️  DOWN').setStyle(ButtonStyle.Danger),
  );
}

function leaveRequestEmbed(form, submitter, sheetRow) {
  return new EmbedBuilder()
    .setColor(0x4f9d82)
    .setAuthor({ name: 'CERERE NOUĂ • CONCEDIU' })
    .setTitle(`🌴 ${form.name}`)
    .setDescription('Verifică perioada și motivul, apoi aprobă sau respinge cererea.')
    .addFields(
      { name: 'Nume + Prenume', value: form.name, inline: true },
      { name: 'ID IN-GAME', value: form.memberId, inline: true },
      { name: 'Callsign', value: form.callsign, inline: true },
      { name: 'Perioada', value: `${form.startDate} – ${form.endDate}`, inline: true },
      { name: 'Motiv', value: form.reason, inline: false },
      { name: 'Trimisă de', value: `<@${submitter.id}>`, inline: true },
      { name: 'Status', value: '🟠 În așteptarea HR', inline: false },
      { name: 'Rând în foaia Concedii', value: String(sheetRow), inline: true },
    )
    .setFooter({ text: 'Panel concediu • Decizia este înregistrată în Discord' });
}

function leaveRequestButtons(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(LEAVE_APPROVE_BUTTON).setLabel('Aprobă concediul').setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId(LEAVE_REJECT_BUTTON).setLabel('Respinge cererea').setStyle(ButtonStyle.Danger).setDisabled(disabled),
  );
}

function leaveDecisionEmbed(embed, approved, reviewer) {
  const next = EmbedBuilder.from(embed).setColor(approved ? 0x2ecc71 : 0xe74c3c);
  const statusIndex = embed.fields.findIndex((field) => field.name === 'Status');
  if (statusIndex >= 0) {
    next.spliceFields(statusIndex, 1, { name: 'Status', value: approved ? '✅ Concediu aprobat' : '❌ Cerere respinsă', inline: false });
  }
  next.addFields(
    { name: 'Decis de HR', value: `<@${reviewer.id}> (${reviewer.username})`, inline: true },
    { name: 'Data deciziei', value: new Date().toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest' }), inline: true },
  );
  return next;
}

async function appendLeaveRequest(form, submitter) {
  const sheets = await getSheetsApi();
  const spreadsheetId = required('GOOGLE_SPREADSHEET_ID');
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties(sheetId,title)' });
  if (!(meta.data.sheets ?? []).some((sheet) => sheet.properties.title === 'Concedii')) {
    throw new Error('Nu am găsit fila „Concedii” în Google Sheets. Verifică numele filei.');
  }
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${quoteTab('Concedii')}!B4:B`,
    valueRenderOption: 'FORMATTED_VALUE',
  });
  const idColumn = existing.data.values ?? [];
  const firstEmpty = idColumn.findIndex((row) => !String(row[0] ?? '').trim());
  const rowNumber = firstEmpty < 0 ? idColumn.length + 4 : firstEmpty + 4;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${quoteTab('Concedii')}!B${rowNumber}:J${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[form.memberId, form.name, form.callsign, form.startDate, form.endDate, form.reason, 'În așteptarea HR', '', '']] },
  });
  return rowNumber;
}

async function updateLeaveDecision(rowNumber, approved, reviewer) {
  if (!Number.isInteger(rowNumber) || rowNumber < 4) throw new Error('Nu am putut identifica rândul cererii din fila „Concedii”.');
  const sheets = await getSheetsApi();
  const spreadsheetId = required('GOOGLE_SPREADSHEET_ID');
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${quoteTab('Concedii')}!H${rowNumber}:J${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[approved ? 'Aprobat' : 'Respins', `<@${reviewer.id}> (${reviewer.username})`, departureDateString()]] },
  });
}

function applicationEmbed(form, submitter) {
  return new EmbedBuilder()
    .setColor(0xf0ad4e)
    .setAuthor({ name: 'CERERE NOUĂ • VERIFICARE HR' })
    .setTitle(`🗂️ ${form.name}`)
    .setDescription('Verifică datele de mai jos. Dacă reintegrarea este NU, aprobarea acordă gradul Cadet; dacă este DA, gradul se calculează din fila Reintegrare.')
    .addFields(
      { name: 'ID IN-GAME', value: form.memberId, inline: true },
      { name: 'Secție', value: form.section, inline: true },
      { name: 'Reintegrare valabilă', value: form.rehire === 'da' ? 'Da' : 'Nu', inline: true },
      { name: 'Discord', value: `<@${form.discordId}>`, inline: true },
      { name: 'Discord ID', value: form.discordId, inline: true },
      { name: 'Trimisă de', value: `<@${submitter.id}>`, inline: true },
      { name: 'Status', value: '🟠 În așteptare', inline: false },
    )
    .setFooter({ text: 'Panel de înscriere • Cerere în așteptarea HR' });
}

function applicationButtons(disabled = false, reintegration = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(ACCEPT_BUTTON)
      .setLabel(reintegration ? 'Aprobă reintegrarea • grad automat' : 'Aprobă ca Cadet')
      .setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId(REJECT_BUTTON).setLabel('Respinge cererea').setStyle(ButtonStyle.Danger).setDisabled(disabled),
  );
}

function getField(embed, name) {
  return embed.fields.find((field) => field.name === name)?.value?.trim() ?? '';
}

function getFormFromMessage(message) {
  const embed = message.embeds[0];
  if (!embed) throw new Error('Nu am găsit datele cererii în mesajul HR.');
  return {
    memberId: getField(embed, 'ID IN-GAME'),
    name: embed.title?.replace(/^🗂️\s*/, '') ?? '',
    section: getField(embed, 'Secție'),
    discordId: getField(embed, 'Discord ID'),
    rehire: getField(embed, 'Reintegrare valabilă') === 'Da' ? 'da' : 'nu',
  };
}

function updatedDecisionEmbed(embed, status, reviewer, rank = '', previousRank = '') {
  const next = EmbedBuilder.from(embed).setColor(status === 'Aprobat' ? 0x2ecc71 : 0xe74c3c);
  next.spliceFields(embed.fields.findIndex((field) => field.name === 'Status'), 1,
    { name: 'Status', value: status === 'Aprobat' ? `✅ Aprobat • **${rank}**` : '❌ Respinsă', inline: false },
    { name: 'Decis de HR', value: `<@${reviewer.id}> (${reviewer.username})`, inline: true },
    { name: 'Data deciziei', value: new Date().toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest' }), inline: true },
  );
  if (status === 'Aprobat' && previousRank) {
    next.addFields({ name: 'Grad anterior (Reintegrare)', value: previousRank, inline: true });
  }
  return next;
}

function normalizeGrade(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ro').replace(/[-‐‑‒–—_]/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeRoleName(value) {
  return normalizeGrade(value).replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();
}

function automaticReintegrationGrade(previousGrade) {
  const grade = normalizeGrade(previousGrade);
  if (/\b(agent sef principal|asp)\b/.test(grade)) return 'Agent-Principal';
  if (/\b(agent principal|ap)\b/.test(grade)) return 'Agent';
  if (/\b(inspector|sub\s*comisar|comisar|chestor general)\b/.test(grade)) return 'Agent-Sef-Principal';
  return null;
}

function sanctionsToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Bucharest', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function sanctionsDateAfterDaysIso(days) {
  const [year, month, day] = sanctionsToday().split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function columnNumber(column) {
  return column.split('').reduce((number, char) => number * 26 + char.charCodeAt(0) - 64, 0);
}

async function getSanctionsSheetProperties(sheets, spreadsheetId) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties(sheetId,title)' });
  const sanctionSheet = (meta.data.sheets ?? []).find((sheet) => sheet.properties.title === SANCTIONS_SHEET_NAME)?.properties;
  const memberSheet = (meta.data.sheets ?? []).find((sheet) => sheet.properties.title === 'MEMBRII POLITIE')?.properties;
  if (!sanctionSheet) throw new Error(`Nu am găsit fila „${SANCTIONS_SHEET_NAME}” în Google Sheets.`);
  if (!memberSheet) throw new Error('Nu am găsit fila „MEMBRII POLITIE” în Google Sheets.');
  return { sanctionSheet, memberSheet };
}

function normalizeSheetId(value) {
  return String(value ?? '').trim().replace(/^0+(?=\d)/, '');
}

async function findSanctionMemberRow(sheets, spreadsheetId, memberId) {
  const range = `${quoteTab('MEMBRII POLITIE')}!A7:A348`;
  const [formatted, raw] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId, range, valueRenderOption: 'FORMATTED_VALUE' }),
    sheets.spreadsheets.values.get({ spreadsheetId, range, valueRenderOption: 'UNFORMATTED_VALUE' }),
  ]);
  const rows = formatted.data.values ?? [];
  const offset = rows.findIndex((row) => normalizeSheetId(row[0]) === normalizeSheetId(memberId));
  if (offset < 0) throw new Error(`ID-ul ${memberId} nu a fost găsit în MEMBRII POLITIE!A7:A348.`);
  return {
    rowNumber: offset + 7,
    callsign: String(rows[offset][0] ?? '').trim(),
    lookupValue: raw.data.values?.[offset]?.[0] ?? rows[offset][0],
  };
}

async function authorizeSanctionCommand(interaction, certificate) {
  const caller = await interaction.guild.members.fetch(interaction.user.id);
  const chiefRoleId = process.env.DISCORD_ROLE_INSTRUCTOR_SEF_ID?.trim();
  const instructorRoleId = process.env[certificate.roleSetting]?.trim();
  if (!(chiefRoleId && caller.roles.cache.has(chiefRoleId))
      && !(instructorRoleId && caller.roles.cache.has(instructorRoleId))) {
    throw new Error(`Ai nevoie de rolul Discord ${certificate.label} sau INSTRUCTOR ȘEF pentru această comandă.`);
  }
}

async function authorizeUpDown(interaction) {
  const managementRoleId = process.env.UPDOWN_MANAGEMENT_ROLE_ID?.trim();
  if (!managementRoleId) throw new Error('Lipsește UPDOWN_MANAGEMENT_ROLE_ID din .env. Adaugă ID-ul rolului Conducere.');
  const member = await interaction.guild.members.fetch(interaction.user.id);
  if (!member.roles.cache.has(managementRoleId)) {
    throw new Error('Doar membrii cu rolul Conducere pot folosi panelul UP/DOWN.');
  }
}

async function authorizeChestorGeneral(interaction) {
  const roleId = process.env.DISCORD_ROLE_CHESTOR_GENERAL_ID?.trim();
  if (!roleId) throw new Error('Lipsește DISCORD_ROLE_CHESTOR_GENERAL_ID din .env.');
  const member = await interaction.guild.members.fetch(interaction.user.id);
  if (!member.roles.cache.has(roleId)) {
    throw new Error('Doar membrii cu rolul Chestor General pot publica paneluri.');
  }
}

async function prepareUpDownDiscordUpdate(guild, fromGrade, toGrade, discordId, memberName) {
  if (!/^\d{15,25}$/.test(discordId)) throw new Error('Membrul nu are un Discord ID valid în coloana T; nu am schimbat datele.');
  if (!memberName) throw new Error('Membrului îi lipsește numele din coloana C; nu am schimbat datele.');
  const fromSetting = UPDOWN_ROLE_SETTINGS[fromGrade];
  const toSetting = UPDOWN_ROLE_SETTINGS[toGrade];
  const fromRoleId = fromSetting ? process.env[fromSetting]?.trim() : '';
  const toRoleId = toSetting ? process.env[toSetting]?.trim() : '';
  if (!fromRoleId) throw new Error(`Completează ${fromSetting} cu ID-ul rolului ${fromGrade} din Discord înainte de UP/DOWN.`);
  if (!toRoleId) throw new Error(`Completează ${toSetting} cu ID-ul rolului ${toGrade} din Discord înainte de UP/DOWN.`);
  if (fromRoleId === toRoleId) throw new Error(`Rolurile Discord pentru ${fromGrade} și ${toGrade} trebuie să fie diferite.`);
  const fromRankIndex = UPDOWN_RANK_ORDER.indexOf(fromGrade);
  const toRankIndex = UPDOWN_RANK_ORDER.indexOf(toGrade);
  if (fromRankIndex < 0 || toRankIndex < 0) throw new Error('Gradul selectat nu are o poziție validă în ierarhie.');
  const gradeRoleIds = new Map();
  const roleOwners = new Map();
  for (const [grade, setting] of Object.entries(UPDOWN_ROLE_SETTINGS)) {
    const roleId = process.env[setting]?.trim();
    if (!roleId) throw new Error(`Completează ${setting} cu ID-ul rolului ${grade}; UP/DOWN nu a modificat datele.`);
    if (roleOwners.has(roleId)) throw new Error(`Setările ${roleOwners.get(roleId)} și ${setting} folosesc același Discord Role ID.`);
    gradeRoleIds.set(grade, roleId);
    roleOwners.set(roleId, setting);
  }
  const bonusRoleIds = new Map();
  for (const bonus of UPDOWN_BONUS_ROLES) {
    const roleId = process.env[bonus.roleSetting]?.trim();
    if (!roleId) throw new Error(`Completează ${bonus.roleSetting} cu ID-ul rolului ${bonus.label}; UP/DOWN nu a modificat datele.`);
    bonusRoleIds.set(bonus.roleSetting, roleId);
  }

  const botMember = guild.members.me ?? await guild.members.fetchMe();
  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new Error('Botul are nevoie de permisiunea Manage Roles pentru UP/DOWN.');
  }
  if (!botMember.permissions.has(PermissionFlagsBits.ManageNicknames)
      && !botMember.permissions.has(PermissionFlagsBits.Administrator)) {
    throw new Error('Botul are nevoie de permisiunea Manage Nicknames pentru UP/DOWN.');
  }
  const roleIdsToFetch = [...new Set([...gradeRoleIds.values(), ...bonusRoleIds.values()])];
  const [fetchedRoles, member] = await Promise.all([
    Promise.all(roleIdsToFetch.map((id) => guild.roles.fetch(id).catch(() => null))),
    guild.members.fetch(discordId).catch(() => null),
  ]);
  const rolesById = new Map(roleIdsToFetch.map((id, index) => [id, fetchedRoles[index]]));
  const fromRole = rolesById.get(fromRoleId);
  const toRole = rolesById.get(toRoleId);
  if (!fromRole) throw new Error(`Nu găsesc rolul pentru ${fromGrade}; verifică ${fromSetting}.`);
  if (!toRole) throw new Error(`Nu găsesc rolul pentru ${toGrade}; verifică ${toSetting}.`);
  if (!member) throw new Error(`Membrul cu Discord ID ${discordId} nu este pe server.`);
  for (const [roleId, role] of rolesById) {
    if (!role) {
      throw new Error(`Nu am găsit rolul Discord cu ID-ul ${roleId}, necesar pentru UP/DOWN.`);
    }
    if (role.managed || botMember.roles.highest.comparePositionTo(role) <= 0) {
      throw new Error('Mută rolul botului deasupra rolurilor de grad UP/DOWN în setările serverului.');
    }
  }
  if (member.id === guild.ownerId || botMember.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
    throw new Error('Botul nu poate schimba rolul sau nickname-ul membrului din cauza ierarhiei rolurilor.');
  }

  return async (callSign) => {
    const bonusRolesToKeep = UPDOWN_BONUS_ROLES
      .filter((bonus) => UPDOWN_RANK_ORDER.indexOf(bonus.threshold) <= toRankIndex)
      .map((bonus) => rolesById.get(bonusRoleIds.get(bonus.roleSetting)));
    const rolesToAdd = [toRole, ...bonusRolesToKeep];
    const retainedIds = new Set(rolesToAdd.map((role) => role.id));
    const allGradeRoles = [...gradeRoleIds.values()].map((roleId) => rolesById.get(roleId));
    const removeUnique = [...new Map([...allGradeRoles, ...[...bonusRoleIds.values()].map((roleId) => rolesById.get(roleId))]
      .filter((role) => !retainedIds.has(role.id)).map((role) => [role.id, role])).values()]
      .filter((role) => member.roles.cache.has(role.id));
    const addUnique = [...new Map(rolesToAdd.map((role) => [role.id, role])).values()]
      .filter((role) => !member.roles.cache.has(role.id));
    if (removeUnique.length) await member.roles.remove(removeUnique, `Grad schimbat prin ${fromGrade} → ${toGrade}`);
    if (addUnique.length) await member.roles.add(addUnique, `Grad schimbat prin ${fromGrade} → ${toGrade}`);
    const desiredNickname = callSign ? `[${callSign}] ${memberName}` : memberName;
    const nickname = Array.from(desiredNickname).slice(0, 32).join('');
    await member.setNickname(nickname, `Nickname actualizat prin ${fromGrade} → ${toGrade}`);
    const refreshedMember = await guild.members.fetch({ user: discordId, force: true });
    if (refreshedMember.nickname !== nickname) {
      throw new Error(`Discord nu a confirmat nickname-ul „${nickname}”. Verifică permisiunea Manage Nicknames și ierarhia rolurilor.`);
    }
    return { roleName: toRole.name, nickname };
  };
}

function sheetCellValue(value) {
  if (value === null || value === undefined || value === '') return {};
  if (typeof value === 'boolean') return { userEnteredValue: { boolValue: value } };
  if (typeof value === 'number') return { userEnteredValue: { numberValue: value } };
  return { userEnteredValue: { stringValue: String(value) } };
}

function setSheetCellRequest(sheetId, rowNumber, columnNumberValue, value) {
  return {
    updateCells: {
      range: {
        sheetId,
        startRowIndex: rowNumber - 1,
        endRowIndex: rowNumber,
        startColumnIndex: columnNumberValue - 1,
        endColumnIndex: columnNumberValue,
      },
      rows: [{ values: [sheetCellValue(value)] }],
      fields: 'userEnteredValue',
    },
  };
}

function clearSheetCellRequest(sheetId, rowNumber, columnNumberValue) {
  return setSheetCellRequest(sheetId, rowNumber, columnNumberValue, null);
}

async function moveMemberRank(interaction, memberId, action) {
  if (!/^\d+$/.test(memberId) || normalizeSheetId(memberId) === '0') {
    throw new Error('Introdu un ID in-game numeric valid.');
  }
  const steps = UPDOWN_STEPS[action];
  if (!steps) throw new Error('Acțiunea UP/DOWN selectată nu este validă.');

  const sheets = await getSheetsApi();
  const spreadsheetId = required('GOOGLE_SPREADSHEET_ID');
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties(sheetId,title)' });
  const properties = new Map((meta.data.sheets ?? []).map((sheet) => [sheet.properties.title, sheet.properties]));
  const policeSheet = properties.get('MEMBRII POLITIE');
  if (!policeSheet) throw new Error('Nu am găsit fila „MEMBRII POLITIE”.');
  const monitorSheet = properties.get('MONITORIZARE ACTIVITATE');
  const mainTab = quoteTab('MEMBRII POLITIE');
  const [mainResult, monitorResult] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId, range: `${mainTab}!A7:X338`, valueRenderOption: 'UNFORMATTED_VALUE' }),
    monitorSheet
      ? sheets.spreadsheets.values.get({ spreadsheetId, range: `${quoteTab('MONITORIZARE ACTIVITATE')}!A1:K1000`, valueRenderOption: 'UNFORMATTED_VALUE' })
      : Promise.resolve(null),
  ]);
  const mainRows = mainResult.data.values ?? [];
  const memberKey = normalizeSheetId(memberId);
  const matches = [];
  for (const step of steps) {
    for (let rowNumber = step.source[0]; rowNumber <= step.source[1]; rowNumber += 1) {
      const row = mainRows[rowNumber - 7] ?? [];
      if (normalizeSheetId(row[0]) === memberKey) matches.push({ step, rowNumber, row });
    }
  }
  if (!matches.length) throw new Error(`ID-ul ${memberId} nu a fost găsit într-un grad eligibil pentru ${action.toUpperCase()}.`);
  if (matches.length > 1) throw new Error(`ID-ul ${memberId} apare de mai multe ori în intervalele de grade. Corectează dublurile înainte să continui.`);

  const { step, rowNumber: sourceRow, row: memberRow } = matches[0];
  const [destinationStart, destinationEnd] = step.destination;
  let destinationRow = -1;
  for (let rowNumber = destinationStart; rowNumber <= destinationEnd; rowNumber += 1) {
    if (!String(mainRows[rowNumber - 7]?.[0] ?? '').trim()) {
      destinationRow = rowNumber;
      break;
    }
  }
  if (destinationRow < 0) throw new Error(`Nu mai sunt locuri pentru ${action.toUpperCase()} la gradul ${step.grade}.`);

  const monitorRows = monitorResult?.data.values ?? [];
  const monitorMatches = monitorSheet
    ? monitorRows.map((row, index) => ({ row, rowNumber: index + 1 }))
      .filter(({ row }) => normalizeSheetId(row[0]) === memberKey)
    : [];
  if (monitorMatches.length > 1) throw new Error(`ID-ul ${memberId} apare de mai multe ori în MONITORIZARE ACTIVITATE. Corectează dublurile înainte să continui.`);

  const discordId = String(memberRow[19] ?? '').trim();
  const memberName = String(memberRow[2] ?? '').trim();
  const updateDiscord = await prepareUpDownDiscordUpdate(interaction.guild, step.fromGrade, step.grade, discordId, memberName);

  const requests = [];
  for (const column of step.columns) {
    const value = column === 11 ? bucharestDateSerial() : (memberRow[column - 1] ?? null);
    requests.push(setSheetCellRequest(policeSheet.sheetId, destinationRow, column, value));
  }

  const monitorEntry = monitorMatches[0];
  if (monitorSheet && monitorEntry) {
    const columns = [1, 3, 5, 6, 7, 8, 9, 10, 11];
    for (const column of columns) {
      requests.push(setSheetCellRequest(monitorSheet.sheetId, destinationRow, column, monitorEntry.row[column - 1] ?? null));
    }
    if (monitorEntry.rowNumber !== destinationRow) {
      for (const column of columns) requests.push(clearSheetCellRequest(monitorSheet.sheetId, monitorEntry.rowNumber, column));
    }
  } else if (monitorSheet) {
    requests.push(setSheetCellRequest(monitorSheet.sheetId, destinationRow, 1, memberRow[0] ?? memberId));
    requests.push(setSheetCellRequest(monitorSheet.sheetId, destinationRow, 3, memberRow[2] ?? ''));
  }

  for (const column of step.columns) requests.push(clearSheetCellRequest(policeSheet.sheetId, sourceRow, column));
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });

  const callSignResult = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${mainTab}!B${destinationRow}`,
    valueRenderOption: 'FORMATTED_VALUE',
  });
  const newCallsign = String(callSignResult.data.values?.[0]?.[0] ?? '').trim();
  const mention = /^\d{15,25}$/.test(discordId) ? `<@${discordId}>` : `ID ${memberId}`;
  const message = action === 'up'
    ? `⬆️ ${mention} — Felicitări! Ai fost promovat de la **${step.fromGrade}** la **${step.grade}**. Noul callsign: **${newCallsign || 'necompletat'}**.`
    : `⬇️ ${mention} — Ai primit DOWN de la **${step.fromGrade}** la **${step.grade}**. Noul callsign: **${newCallsign || 'necompletat'}**.`;
  const warnings = [];
  let discordUpdateWarning = '';
  let discordUpdateSummary = '';
  try {
    const { roleName, nickname } = await updateDiscord(newCallsign);
    discordUpdateSummary = ` Rol Discord: **${roleName}**. Nickname setat: **${nickname}**.`;
    if (!newCallsign) discordUpdateWarning = '\n⚠️ Callsign-ul nou din foaie este gol; botul a aplicat numele fără prefix de callsign.';
    else console.log(`UP/DOWN: ${memberId} a primit rolul ${roleName} și nickname-ul ${nickname}.`);
  } catch (error) {
    console.error('Datele au fost mutate în Sheets, dar rolul/nickname-ul Discord nu a putut fi actualizat:', error);
    discordUpdateWarning = `\n⚠️ Datele au fost mutate în Sheets, dar rolul sau nickname-ul Discord nu s-a putut actualiza: ${error.message}`;
  }
await sendDepartureWebhook('UPDOWN_WEBHOOK_URL', message,
    { users: /^\d{15,25}$/.test(discordId) ? [discordId] : [] }, warnings);

  const result = `✅ **${memberName || `ID ${memberId}`}** a primit ${action.toUpperCase()} de la **${step.fromGrade}** la **${step.grade}**. Noul callsign: **${newCallsign || 'necompletat'}**.${discordUpdateSummary}${discordUpdateWarning}`;
  return warnings.length ? `${result}\n⚠️ Modificarea din Sheets a reușit, dar notificarea nu a fost trimisă: ${warnings.join('; ')}` : result;
}

async function findEmptySanctionRow(sheets, spreadsheetId, certificate) {
  const tab = quoteTab(SANCTIONS_SHEET_NAME);
  const [ids, dates] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId, range: `${tab}!${certificate.callsignColumn}5:${certificate.callsignColumn}1000`, valueRenderOption: 'UNFORMATTED_VALUE' }),
    sheets.spreadsheets.values.get({ spreadsheetId, range: `${tab}!${certificate.dateColumn}5:${certificate.dateColumn}1000`, valueRenderOption: 'UNFORMATTED_VALUE' }),
  ]);
  for (let offset = 0; offset < 996; offset += 1) {
    if (!String(ids.data.values?.[offset]?.[0] ?? '').trim() && !String(dates.data.values?.[offset]?.[0] ?? '').trim()) return offset + 5;
  }
  throw new Error(`Nu mai este loc liber la certificatul ${certificate.label} (rândurile 5–1000).`);
}

async function setSanctionBold(sheets, spreadsheetId, sheetId, certificate, rowNumber, bold) {
  const callsignColumn = columnNumber(certificate.callsignColumn);
  const dateColumn = columnNumber(certificate.dateColumn);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [callsignColumn, dateColumn].map((column) => ({
        repeatCell: {
          range: { sheetId, startRowIndex: rowNumber - 1, endRowIndex: rowNumber, startColumnIndex: column - 1, endColumnIndex: column },
          cell: { userEnteredFormat: { textFormat: { bold } } },
          fields: 'userEnteredFormat.textFormat.bold',
        },
      })),
    },
  });
}

async function clearSanctionCells(sheets, spreadsheetId, certificate, rowNumber, sheetId) {
  const tab = quoteTab(SANCTIONS_SHEET_NAME);
  await sheets.spreadsheets.values.batchClear({
    spreadsheetId,
    requestBody: { ranges: [`${tab}!${certificate.callsignColumn}${rowNumber}`, `${tab}!${certificate.dateColumn}${rowNumber}`] },
  });
  await setSanctionBold(sheets, spreadsheetId, sheetId, certificate, rowNumber, false);
  const dateColumn = columnNumber(certificate.dateColumn);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ repeatCell: {
      range: { sheetId, startRowIndex: rowNumber - 1, endRowIndex: rowNumber, startColumnIndex: dateColumn - 1, endColumnIndex: dateColumn },
      cell: { note: '' }, fields: 'note',
    } }] },
  });
}

async function setMemberSanctionColor(sheets, spreadsheetId, sheetId, rowNumber, colorColumn, color) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ repeatCell: {
      range: { sheetId, startRowIndex: rowNumber - 1, endRowIndex: rowNumber, startColumnIndex: colorColumn - 1, endColumnIndex: colorColumn },
      cell: { userEnteredFormat: { textFormat: { foregroundColor: color } } },
      fields: 'userEnteredFormat.textFormat.foregroundColor',
    } }] },
  });
}

async function addSanctionFromCommand(interaction, { type, memberId, certificateKey, days }) {
  if (!/^\d+$/.test(memberId) || memberId === '0') throw new Error('ID-ul trebuie să fie numeric.');
  const certificate = SANCTION_CERTIFICATES[certificateKey];
  if (!certificate) throw new Error('Certificatul selectat nu este disponibil pentru cooldown/interdicție.');
  if (type === 'Cooldown' && (!Number.isInteger(days) || days < 0 || days > 3650)) throw new Error('Numărul de zile trebuie să fie între 0 și 3650.');
  const permissionCertificate = INSTRUCTOR_CERTIFICATES[certificateKey === 'pilot' ? 'heli' : certificateKey];
  await authorizeSanctionCommand(interaction, permissionCertificate);

  const sheets = await getSheetsApi();
  const spreadsheetId = required('GOOGLE_SPREADSHEET_ID');
  const { sanctionSheet, memberSheet } = await getSanctionsSheetProperties(sheets, spreadsheetId);
  const member = await findSanctionMemberRow(sheets, spreadsheetId, memberId);
  const tab = quoteTab(SANCTIONS_SHEET_NAME);
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId, range: `${tab}!${certificate.callsignColumn}5:${certificate.callsignColumn}1000`, valueRenderOption: 'FORMATTED_VALUE',
  });
  if ((existing.data.values ?? []).some((row) => String(row[0] ?? '').trim() === memberId)) {
    throw new Error(`ID-ul ${memberId} are deja o înregistrare la certificatul ${certificate.label}.`);
  }
  const rowNumber = await findEmptySanctionRow(sheets, spreadsheetId, certificate);
  const expiryIso = type === 'Cooldown' ? sanctionsDateAfterDaysIso(days) : null;
  const displayedDate = expiryIso ? `${expiryIso.slice(8, 10)}.${expiryIso.slice(5, 7)}` : 'INTERDICTIE';
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: 'RAW', data: [
      { range: `${tab}!${certificate.callsignColumn}${rowNumber}`, values: [[member.lookupValue]] },
      { range: `${tab}!${certificate.dateColumn}${rowNumber}`, values: [[displayedDate]] },
    ] },
  });
  const dateColumn = columnNumber(certificate.dateColumn);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ repeatCell: {
      range: { sheetId: sanctionSheet.sheetId, startRowIndex: rowNumber - 1, endRowIndex: rowNumber, startColumnIndex: dateColumn - 1, endColumnIndex: dateColumn },
      cell: { note: expiryIso ? `cooldown-expiry:${expiryIso}` : '' }, fields: 'note',
    } }] },
  });
  await setSanctionBold(sheets, spreadsheetId, sanctionSheet.sheetId, certificate, rowNumber, true);
  if (type === 'Interdicție') {
    await setMemberSanctionColor(sheets, spreadsheetId, memberSheet.sheetId, member.rowNumber, certificate.colorColumn, { red: 1, green: 0, blue: 0 });
  }
  return type === 'Cooldown'
    ? `✅ ID-ul **${member.callsign}** are cooldown de **${days} zile** la **${certificate.label}**, până la **${displayedDate}**.`
    : `✅ ID-ul **${member.callsign}** are **INTERDICTIE** la **${certificate.label}**. Celula corespunzătoare din MEMBRII POLITIE a fost colorată roșu.`;
}

async function getSanctionRows(sheets, spreadsheetId, certificate) {
  const tab = quoteTab(SANCTIONS_SHEET_NAME);
  const result = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: [`${tab}!${certificate.callsignColumn}5:${certificate.callsignColumn}1000`, `${tab}!${certificate.dateColumn}5:${certificate.dateColumn}1000`],
    valueRenderOption: 'FORMATTED_VALUE',
  });
  const [ids = [], dates = []] = (result.data.valueRanges ?? []).map((range) => range.values ?? []);
  return ids.map((row, index) => ({ rowNumber: index + 5, id: String(row[0] ?? '').trim(), date: String(dates[index]?.[0] ?? '').trim() }));
}

async function removeSanctionCooldownFromCommand(interaction, memberId, certificateKey) {
  if (!/^\d+$/.test(memberId) || memberId === '0') throw new Error('ID-ul trebuie să fie numeric.');
  const certificate = SANCTION_CERTIFICATES[certificateKey];
  if (!certificate) throw new Error('Certificatul selectat nu este disponibil pentru cooldown.');
  await authorizeSanctionCommand(interaction, INSTRUCTOR_CERTIFICATES[certificateKey === 'pilot' ? 'heli' : certificateKey]);
  const sheets = await getSheetsApi();
  const spreadsheetId = required('GOOGLE_SPREADSHEET_ID');
  const { sanctionSheet } = await getSanctionsSheetProperties(sheets, spreadsheetId);
  const matches = (await getSanctionRows(sheets, spreadsheetId, certificate)).filter((row) => row.id === memberId);
  if (!matches.length) throw new Error(`Nu am găsit ID-ul ${memberId} la certificatul ${certificate.label}.`);
  if (matches.length > 1) throw new Error(`ID-ul ${memberId} apare de mai multe ori la ${certificate.label}; verifică foaia înainte de eliminare.`);
  const entry = matches[0];
  if (!entry.date) throw new Error(`Înregistrarea pentru ID ${memberId} nu are o dată.`);
  if (entry.date.toUpperCase() === 'INTERDICTIE') return removeSanctionInterdictieFromCommand(interaction, memberId, certificateKey);
  await clearSanctionCells(sheets, spreadsheetId, certificate, entry.rowNumber, sanctionSheet.sheetId);
  return `✅ Cooldown-ul pentru ID **${memberId}** la **${certificate.label}** a fost eliminat.`;
}

async function removeSanctionInterdictieFromCommand(interaction, memberId, certificateKey) {
  if (!/^\d+$/.test(memberId) || memberId === '0') throw new Error('ID-ul trebuie să fie numeric.');
  const chiefRoleId = process.env.DISCORD_ROLE_INSTRUCTOR_SEF_ID?.trim();
  if (!chiefRoleId) throw new Error('Lipsește DISCORD_ROLE_INSTRUCTOR_SEF_ID din .env.');
  const caller = await interaction.guild.members.fetch(interaction.user.id);
  if (!caller.roles.cache.has(chiefRoleId)) throw new Error('Doar un INSTRUCTOR ȘEF poate scoate interdicția.');
  const certificate = SANCTION_CERTIFICATES[certificateKey];
  if (!certificate) throw new Error('Certificatul selectat nu este disponibil pentru interdicție.');
  const sheets = await getSheetsApi();
  const spreadsheetId = required('GOOGLE_SPREADSHEET_ID');
  const { sanctionSheet, memberSheet } = await getSanctionsSheetProperties(sheets, spreadsheetId);
  const matches = (await getSanctionRows(sheets, spreadsheetId, certificate))
    .filter((row) => row.id === memberId && row.date.toUpperCase() === 'INTERDICTIE');
  if (!matches.length) throw new Error(`Nu am găsit interdicția ID ${memberId} la ${certificate.label}.`);
  if (matches.length > 1) throw new Error(`Există mai multe interdicții pentru ID ${memberId} la ${certificate.label}; verifică foaia.`);
  const entry = matches[0];
  await clearSanctionCells(sheets, spreadsheetId, certificate, entry.rowNumber, sanctionSheet.sheetId);
  const member = await findSanctionMemberRow(sheets, spreadsheetId, memberId).catch(() => null);
  if (member) await setMemberSanctionColor(sheets, spreadsheetId, memberSheet.sheetId, member.rowNumber, certificate.colorColumn, { red: 0, green: 0, blue: 0 });
  return `✅ Interdicția pentru ID **${memberId}** la **${certificate.label}** a fost scoasă de <@${interaction.user.id}>.`;
}

async function expireSanctionCooldowns() {
  if (sanctionExpirySweepRunning) return;
  sanctionExpirySweepRunning = true;
  try {
    const sheets = await getSheetsApi();
    const spreadsheetId = required('GOOGLE_SPREADSHEET_ID');
    const { sanctionSheet } = await getSanctionsSheetProperties(sheets, spreadsheetId);
    const today = sanctionsToday();
    let removed = 0;
    for (const certificate of Object.values(SANCTION_CERTIFICATES)) {
      const [values, noteResult] = await Promise.all([
        sheets.spreadsheets.values.batchGet({
          spreadsheetId,
          ranges: [`${quoteTab(SANCTIONS_SHEET_NAME)}!${certificate.callsignColumn}5:${certificate.callsignColumn}1000`, `${quoteTab(SANCTIONS_SHEET_NAME)}!${certificate.dateColumn}5:${certificate.dateColumn}1000`],
          valueRenderOption: 'UNFORMATTED_VALUE',
        }),
        sheets.spreadsheets.get({
          spreadsheetId,
          ranges: [`${quoteTab(SANCTIONS_SHEET_NAME)}!${certificate.dateColumn}5:${certificate.dateColumn}1000`],
          includeGridData: true,
          fields: 'sheets(data(startRow,rowData(values(note))))',
        }),
      ]);
      const [ids = [], dates = []] = (values.data.valueRanges ?? []).map((range) => range.values ?? []);
      const noteRows = noteResult.data.sheets?.[0]?.data?.[0]?.rowData ?? [];
      for (let offset = 0; offset < 996; offset += 1) {
        const id = String(ids[offset]?.[0] ?? '').trim();
        const rawDate = dates[offset]?.[0];
        const note = String(noteRows[offset]?.values?.[0]?.note ?? '').trim();
        if (!id || String(rawDate ?? '').toUpperCase() === 'INTERDICTIE') continue;
        let expiry = note.match(/^cooldown-expiry:(\d{4}-\d{2}-\d{2})$/)?.[1] ?? null;
        if (!expiry && typeof rawDate === 'number') expiry = new Date((rawDate - 25569) * 86400000).toISOString().slice(0, 10);
        if (!expiry && typeof rawDate === 'string') {
          const legacy = rawDate.match(/^(\d{1,2})\.(\d{1,2})$/);
          if (legacy) expiry = `${today.slice(0, 4)}-${legacy[2].padStart(2, '0')}-${legacy[1].padStart(2, '0')}`;
        }
        if (!expiry || expiry > today) continue;
        await clearSanctionCells(sheets, spreadsheetId, certificate, offset + 5, sanctionSheet.sheetId);
        removed += 1;
      }
    }
    if (removed) console.log(`Au fost eliminate automat ${removed} cooldown-uri expirate.`);
  } catch (error) {
    console.error('Nu am putut verifica expirarea cooldown-urilor:', error.message);
  } finally {
    sanctionExpirySweepRunning = false;
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === 'panel-instructor') {
      await authorizeChestorGeneral(interaction);
      await interaction.reply({ embeds: [instructorPanelEmbed()], components: instructorPanelButtons() });
      return;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'panel-updown') {
      await authorizeChestorGeneral(interaction);
      await interaction.reply({ embeds: [upDownPanelEmbed()], components: [upDownPanelButtons()] });
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith(UPDOWN_PANEL_ACTION_PREFIX)) {
      await authorizeUpDown(interaction);
      const action = interaction.customId.slice(UPDOWN_PANEL_ACTION_PREFIX.length);
      if (!['up', 'down'].includes(action)) throw new Error('Acțiunea UP/DOWN selectată nu este validă.');
      await interaction.showModal(new ModalBuilder()
        .setCustomId(`updown_form:${action}`)
        .setTitle(action === 'up' ? '⬆️ UP • Introdu ID-ul' : '⬇️ DOWN • Introdu ID-ul')
        .addComponents(new ActionRowBuilder().addComponents(
          makeInput('updown_member_id', 'ID IN-GAME', 'Introdu ID-ul din MEMBRII POLITIE', true, undefined, 24),
        )));
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('updown_form:')) {
      await authorizeUpDown(interaction);
      const action = interaction.customId.slice('updown_form:'.length);
      if (!['up', 'down'].includes(action)) throw new Error('Acțiunea UP/DOWN selectată nu este validă.');
      const memberId = interaction.fields.getTextInputValue('updown_member_id').trim();
      const lockKey = normalizeSheetId(memberId);
      if (lockedUpDownMembers.has(lockKey)) throw new Error('Se procesează deja o modificare UP/DOWN pentru acest ID.');
      lockedUpDownMembers.add(lockKey);
      try {
        await interaction.deferReply({ ephemeral: true });
        await interaction.editReply(await moveMemberRank(interaction, memberId, action));
      } finally {
        lockedUpDownMembers.delete(lockKey);
      }
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith(INSTRUCTOR_PANEL_CERT_PREFIX)) {
      const certificateKey = interaction.customId.slice(INSTRUCTOR_PANEL_CERT_PREFIX.length);
      const certificate = INSTRUCTOR_CERTIFICATES[certificateKey];
      if (!certificate) throw new Error('Certificatul selectat nu este disponibil în panel.');
      const caller = await interaction.guild.members.fetch(interaction.user.id);
      const isInstructorSef = Boolean(process.env.DISCORD_ROLE_INSTRUCTOR_SEF_ID?.trim()
        && caller.roles.cache.has(process.env.DISCORD_ROLE_INSTRUCTOR_SEF_ID.trim()));
      const isChestorGeneral = Boolean(process.env.DISCORD_ROLE_CHESTOR_GENERAL_ID?.trim()
        && caller.roles.cache.has(process.env.DISCORD_ROLE_CHESTOR_GENERAL_ID.trim()));
      if (!isInstructorSef && !isChestorGeneral) {
        throw new Error('Nu ai rolul necesar pentru a adăuga instructori sau instructori-șefi.');
      }
      const actions = [];
      if (isInstructorSef) {
        actions.push(new ButtonBuilder()
          .setCustomId(`${INSTRUCTOR_PANEL_ACTION_PREFIX}instructor:${certificateKey}`)
          .setLabel('➕ Adaugă INSTRUCTOR')
          .setStyle(ButtonStyle.Success));
      }
      if (isChestorGeneral) {
        actions.push(new ButtonBuilder()
          .setCustomId(`${INSTRUCTOR_PANEL_ACTION_PREFIX}instructor-sef:${certificateKey}`)
          .setLabel('🎖️ Adaugă INSTRUCTOR ȘEF')
          .setStyle(ButtonStyle.Primary));
      }
      await interaction.reply({
        content: `Ai ales **${certificate.label}**. Selectează ce grad vrei să acorzi:`,
        components: [new ActionRowBuilder().addComponents(...actions)],
        ephemeral: true,
      });
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith(INSTRUCTOR_PANEL_ACTION_PREFIX)) {
      const [, , action, certificateKey] = interaction.customId.split(':');
      const certificate = INSTRUCTOR_CERTIFICATES[certificateKey];
      if (!certificate || !['instructor', 'instructor-sef'].includes(action)) {
        throw new Error('Acțiunea selectată în panel nu este validă.');
      }
      const requiredRoleSetting = action === 'instructor'
        ? 'DISCORD_ROLE_INSTRUCTOR_SEF_ID'
        : 'DISCORD_ROLE_CHESTOR_GENERAL_ID';
      const requiredRoleId = process.env[requiredRoleSetting]?.trim();
      if (!requiredRoleId) throw new Error(`Lipsește ${requiredRoleSetting} din .env.`);
      const caller = await interaction.guild.members.fetch(interaction.user.id);
      if (!caller.roles.cache.has(requiredRoleId)) {
        throw new Error(action === 'instructor'
          ? 'Doar membrii cu rolul INSTRUCTOR ȘEF pot adăuga INSTRUCTORI.'
          : 'Doar membrii cu rolul Chestor General pot acorda gradul de INSTRUCTOR ȘEF.');
      }
      await interaction.showModal(new ModalBuilder()
        .setCustomId(`instructor_panel_form:${action}:${certificateKey}`)
        .setTitle(`${action === 'instructor' ? 'Adaugă INSTRUCTOR' : 'Adaugă INSTRUCTOR ȘEF'} • ${certificate.label}`)
        .addComponents(new ActionRowBuilder().addComponents(
          makeInput('instructor_panel_member_id', 'ID-ul membrului (in-game)', 'Introdu ID-ul din lista principală', true, undefined, 24),
        )));
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('instructor_panel_form:')) {
      const [, action, certificateKey] = interaction.customId.split(':');
      if (!INSTRUCTOR_CERTIFICATES[certificateKey] || !['instructor', 'instructor-sef'].includes(action)) {
        throw new Error('Formularul pentru instructor nu este valid.');
      }
      const memberId = interaction.fields.getTextInputValue('instructor_panel_member_id').trim();
      await interaction.deferReply({ ephemeral: true });
      const result = action === 'instructor-sef'
        ? await addInstructorSefFromCommand(interaction, memberId, certificateKey)
        : await addInstructorFromCommand(interaction, memberId, certificateKey);
      await interaction.editReply(result);
      return;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'panel-cooldown') {
      await authorizeChestorGeneral(interaction);
      await interaction.reply({ embeds: [cooldownPanelEmbed()], components: [cooldownPanelButtons()] });
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith(COOLDOWN_CERT_BUTTON_PREFIX)) {
      const certificateKey = interaction.customId.slice(COOLDOWN_CERT_BUTTON_PREFIX.length);
      const certificate = SANCTION_CERTIFICATES[certificateKey];
      if (!certificate) throw new Error('Certificatul selectat nu este disponibil în panel.');
      const permissionCertificate = INSTRUCTOR_CERTIFICATES[certificateKey === 'pilot' ? 'heli' : certificateKey];
      await authorizeSanctionCommand(interaction, permissionCertificate);
      await interaction.reply({
        content: `Ce vrei să faci pentru **${certificate.label}**?`,
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`${COOLDOWN_ACTION_PREFIX}add:${certificateKey}`).setLabel('➕ Adaugă cooldown / interdicție').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`${COOLDOWN_ACTION_PREFIX}remove:${certificateKey}`).setLabel('➖ Scoate cooldown / interdicție').setStyle(ButtonStyle.Danger),
        )],
        ephemeral: true,
      });
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith(COOLDOWN_ACTION_PREFIX)) {
      const [, , action, certificateKey] = interaction.customId.split(':');
      const certificate = SANCTION_CERTIFICATES[certificateKey];
      if (!certificate || !['add', 'remove'].includes(action)) throw new Error('Acțiunea de cooldown selectată nu este validă.');
      const permissionCertificate = INSTRUCTOR_CERTIFICATES[certificateKey === 'pilot' ? 'heli' : certificateKey];
      await authorizeSanctionCommand(interaction, permissionCertificate);
      const modal = new ModalBuilder()
        .setCustomId(`cooldown_form:${action}:${certificateKey}`)
        .setTitle(`${action === 'add' ? 'Adaugă' : 'Scoate'} cooldown / interdicție • ${certificate.label}`)
        .addComponents(new ActionRowBuilder().addComponents(makeInput('cooldown_member_id', 'ID din MEMBRII POLITIE', 'Introdu ID-ul din coloana A', true, undefined, 24)));
      if (action === 'add') {
        modal.addComponents(new ActionRowBuilder().addComponents(makeInput('cooldown_days', 'Zile sau INTERDICTIE', 'Ex.: 7, permanent sau interdictie', true, undefined, 20)));
      }
      await interaction.showModal(modal);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('cooldown_form:')) {
      const [, action, certificateKey] = interaction.customId.split(':');
      const certificate = SANCTION_CERTIFICATES[certificateKey];
      if (!certificate || !['add', 'remove'].includes(action)) throw new Error('Formularul de cooldown nu este valid.');
      const permissionCertificate = INSTRUCTOR_CERTIFICATES[certificateKey === 'pilot' ? 'heli' : certificateKey];
      await authorizeSanctionCommand(interaction, permissionCertificate);
      const memberId = interaction.fields.getTextInputValue('cooldown_member_id').trim();
      await interaction.deferReply({ ephemeral: true });
      if (action === 'add') {
        const duration = interaction.fields.getTextInputValue('cooldown_days').trim().toLocaleLowerCase('ro');
        if (['permanent', 'interdictie', 'interdicție'].includes(duration)) {
          await interaction.editReply(await addSanctionFromCommand(interaction, { type: 'Interdicție', memberId, certificateKey }));
        } else {
          if (!/^\d+$/.test(duration)) throw new Error('Scrie un număr de zile între 0 și 3650 sau „interdictie”.');
          const days = Number(duration);
          if (days > 3650) throw new Error('Numărul de zile trebuie să fie între 0 și 3650.');
          await interaction.editReply(await addSanctionFromCommand(interaction, { type: 'Cooldown', memberId, certificateKey, days }));
        }
      } else {
        await interaction.editReply(await removeSanctionCooldownFromCommand(interaction, memberId, certificateKey));
      }
      return;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'panel') {
      await authorizeChestorGeneral(interaction);
      const reviewChannel = await ensureReviewChannel(interaction.guild);
      const button = new ButtonBuilder().setCustomId(PANEL_BUTTON).setLabel('📝 COMPLETEAZĂ FORMULARUL').setStyle(ButtonStyle.Primary);
      await interaction.reply({ embeds: [panelEmbed()], components: [new ActionRowBuilder().addComponents(button)] });
      await interaction.followUp({ content: `Canalul privat pentru cereri HR este ${reviewChannel}.`, ephemeral: true });
      return;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'panel-out') {
      await authorizeChestorGeneral(interaction);
      const resignButton = new ButtonBuilder().setCustomId(DEPARTURE_RESIGN_BUTTON).setLabel('📝 DEMISIE').setStyle(ButtonStyle.Secondary);
      const outButton = new ButtonBuilder().setCustomId(DEPARTURE_OUT_BUTTON).setLabel('🚨 OUT').setStyle(ButtonStyle.Danger);
      await interaction.reply({ embeds: [departurePanelEmbed()], components: [new ActionRowBuilder().addComponents(resignButton, outButton)] });
      return;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'panel-concediu') {
      await authorizeChestorGeneral(interaction);
      await ensureReviewChannel(interaction.guild);
      const button = new ButtonBuilder().setCustomId(LEAVE_PANEL_BUTTON).setLabel('🌴 SOLICITĂ CONCEDIU').setStyle(ButtonStyle.Success);
      await interaction.reply({ embeds: [leavePanelEmbed()], components: [new ActionRowBuilder().addComponents(button)] });
      return;
    }

    if (interaction.isButton() && interaction.customId === LEAVE_PANEL_BUTTON) {
      if (!canSubmit(interaction)) {
        await interaction.reply({ content: 'Nu ai permisiunea necesară pentru a trimite o cerere de concediu.', ephemeral: true });
        return;
      }
      const modal = new ModalBuilder().setCustomId('leave_form').setTitle('Cerere de concediu').addComponents(
        new ActionRowBuilder().addComponents(makeInput('leave_name', 'Nume + Prenume', 'Introdu numele complet', true, undefined, 100)),
        new ActionRowBuilder().addComponents(makeInput('leave_member_id', 'ID IN-GAME', 'Introdu ID-ul in-game', true, undefined, 24)),
        new ActionRowBuilder().addComponents(makeInput('leave_callsign', 'Callsign', 'Ex.: [001] Manea Fane', true, undefined, 80)),
        new ActionRowBuilder().addComponents(makeInput('leave_interval', 'Perioada: start - end', 'Ex.: 10.10.2026 - 17.10.2026', true, undefined, 100)),
        new ActionRowBuilder().addComponents(makeInput('leave_reason', 'Motiv', 'Descrie motivul cererii', true, undefined, 1000, TextInputStyle.Paragraph)),
      );
      await interaction.showModal(modal);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId === 'leave_form') {
      if (!canSubmit(interaction)) {
        await interaction.reply({ content: 'Nu ai permisiunea necesară pentru a trimite o cerere de concediu.', ephemeral: true });
        return;
      }
      const form = {
        name: interaction.fields.getTextInputValue('leave_name').trim(),
        memberId: interaction.fields.getTextInputValue('leave_member_id').trim(),
        callsign: interaction.fields.getTextInputValue('leave_callsign').trim(),
        interval: interaction.fields.getTextInputValue('leave_interval').trim(),
        reason: interaction.fields.getTextInputValue('leave_reason').trim(),
      };
      const intervalMatch = form.interval.match(/^\s*(.+?)\s+(?:-|–|—|până la)\s+(.+?)\s*$/i);
      if (!form.name || !form.callsign || !form.reason || !intervalMatch || !/^\d+$/.test(form.memberId) || form.memberId === '0') {
        await interaction.reply({ content: 'Completează toate câmpurile, introdu un ID in-game numeric valid și scrie perioada ca „data start - data end”.', ephemeral: true });
        return;
      }
      form.startDate = intervalMatch[1].trim();
      form.endDate = intervalMatch[2].trim();
      await interaction.deferReply({ ephemeral: true });
      const reviewChannel = await ensureReviewChannel(interaction.guild);
      const sheetRow = await appendLeaveRequest(form, interaction.user);
      const hrRoles = [...new Set(roleIds('HR_REVIEW_ROLE_IDS'))];
      try {
        const requestMessage = await reviewChannel.send({
          content: hrRoles.map((id) => `<@&${id}>`).join(' '),
          embeds: [leaveRequestEmbed(form, interaction.user, sheetRow)],
          components: [leaveRequestButtons()],
          allowedMentions: { users: [interaction.user.id], roles: hrRoles },
        });
        await interaction.editReply(`✅ Cererea de concediu a fost trimisă HR și salvată în fila „Concedii” (rândul ${sheetRow}).`);
        console.log(`Cerere concediu ${requestMessage.id} (rând ${sheetRow}) trimisă de ${interaction.user.tag}`);
      } catch (error) {
        console.error('Cererea a fost salvată în Concedii, dar mesajul HR nu a putut fi trimis:', error);
        await interaction.editReply(`⚠️ Cererea a fost salvată în fila „Concedii”, rândul ${sheetRow}, dar nu am putut trimite mesajul în canalul HR: ${error.message}`);
      }
      return;
    }

    if (interaction.isButton() && [LEAVE_APPROVE_BUTTON, LEAVE_REJECT_BUTTON].includes(interaction.customId)) {
      if (!isReviewChannel(interaction)) {
        await interaction.reply({ content: 'Acest buton poate fi folosit doar în canalul privat HR.', ephemeral: true });
        return;
      }
      if (!canReview(interaction)) {
        await interaction.reply({ content: 'Doar membrii cu rol HR pot decide cererile de concediu.', ephemeral: true });
        return;
      }
      const message = interaction.message;
      const status = getField(message.embeds[0], 'Status');
      if (!status.startsWith('🟠')) {
        await interaction.reply({ content: 'Cererea a fost deja soluționată.', ephemeral: true });
        return;
      }
      if (lockedApplications.has(message.id)) {
        await interaction.reply({ content: 'Un HR procesează deja această cerere.', ephemeral: true });
        return;
      }
      lockedApplications.add(message.id);
      await interaction.deferUpdate();
      try {
        const rowNumber = Number(getField(message.embeds[0], 'Rând în foaia Concedii'));
        const approved = interaction.customId === LEAVE_APPROVE_BUTTON;
        await updateLeaveDecision(rowNumber, approved, interaction.user);
        await message.edit({ embeds: [leaveDecisionEmbed(message.embeds[0], approved, interaction.user)], components: [leaveRequestButtons(true)] });
      } finally {
        lockedApplications.delete(message.id);
      }
      return;
    }

    if (interaction.isButton() && [DEPARTURE_RESIGN_BUTTON, DEPARTURE_OUT_BUTTON].includes(interaction.customId)) {
      if (interaction.customId === DEPARTURE_OUT_BUTTON && !canSubmitOut(interaction)) {
        await interaction.reply({ content: `Doar membrii cu rolul <@&${departureOutRoleId()}> pot trimite OUT.`, ephemeral: true, allowedMentions: { roles: [] } });
        return;
      }
      const departureType = interaction.customId === DEPARTURE_RESIGN_BUTTON ? 'demisie' : 'out';
      const modal = new ModalBuilder().setCustomId(`departure_form:${departureType}`).setTitle(departureType === 'demisie' ? 'Înregistrare demisie' : 'Cerere OUT')
        .addComponents(new ActionRowBuilder().addComponents(makeInput('departure_member_id', 'ID in-game', 'Introdu ID-ul in-game', true, undefined, 24)));
      if (departureType === 'out') {
        modal.addComponents(new ActionRowBuilder().addComponents(makeInput('departure_reason', 'Motivul', 'Scrie motivul ieșirii', true, undefined, 1000, TextInputStyle.Paragraph)));
        modal.addComponents(new ActionRowBuilder().addComponents(makeInput('departure_evidence', 'Link filmare cu motivul', 'Adaugă linkul către dovadă', true, undefined, 500)));
      }
      await interaction.showModal(modal);
      return;
    }

    if (interaction.isModalSubmit() && ['departure_form:demisie', 'departure_form:out'].includes(interaction.customId)) {
      if (interaction.customId === 'departure_form:out' && !canSubmitOut(interaction)) {
        await interaction.reply({ content: `Doar membrii cu rolul <@&${departureOutRoleId()}> pot trimite OUT.`, ephemeral: true, allowedMentions: { roles: [] } });
        return;
      }
      const memberId = interaction.fields.getTextInputValue('departure_member_id').trim();
      if (!/^\d+$/.test(memberId) || memberId === '0') {
        await interaction.reply({ content: 'ID-ul in-game trebuie să fie numeric și valid.', ephemeral: true });
        return;
      }
      const departureType = interaction.customId.endsWith(':out') ? 'out' : 'demisie';
      const reason = departureType === 'out' ? interaction.fields.getTextInputValue('departure_reason').trim() : '';
      if (departureType === 'out' && !reason) {
        await interaction.reply({ content: 'Completează motivul.', ephemeral: true });
        return;
      }
      let evidenceUrl = '';
      if (departureType === 'out') {
        evidenceUrl = interaction.fields.getTextInputValue('departure_evidence').trim();
        let parsedEvidence;
        try { parsedEvidence = new URL(evidenceUrl); } catch { parsedEvidence = null; }
        if (!parsedEvidence || !['http:', 'https:'].includes(parsedEvidence.protocol)) {
          await interaction.reply({ content: 'Adaugă un link valid (http/https) la filmarea care arată motivul pentru OUT.', ephemeral: true });
          return;
        }
      }
      await interaction.deferReply({ ephemeral: true });
      const result = await executeDeparture(memberId, departureType, reason, evidenceUrl, interaction.guild);
      const warnings = result.warnings.length ? `\n\n⚠️ Unele operații nu au fost finalizate:\n${result.warnings.join('\n')}` : '';
      const confirmation = departureType === 'out'
        ? `✅ Membrul cu ID in-game ${memberId} a fost scos prin OUT.`
        : `✅ Demisia membrului cu ID in-game ${memberId} a fost acceptată.`;
      const removedRolesText = result.removedDiscordRoles?.length
        ? `\nRoluri Discord retrase: ${result.removedDiscordRoles.join(', ')}` : '';
      await interaction.editReply(`${confirmation}${removedRolesText}${reason ? `\nMotiv: ${reason}` : ''}${evidenceUrl ? `\nFilmarea: ${evidenceUrl}` : ''}${warnings}`);
      console.log(`${departureType === 'out' ? 'OUT' : 'Demisie'} ${memberId} procesat de ${interaction.user.tag}`);
      return;
    }

    if (interaction.isButton() && interaction.customId === PANEL_BUTTON) {
      console.log(`Buton formular apăsat de ${interaction.user.tag} pe serverul ${interaction.guildId}`);
      if (!canSubmit(interaction)) {
        await interaction.reply({ content: 'Nu ai permisiunea necesară pentru a folosi formularul.', ephemeral: true });
        return;
      }
      const modal = new ModalBuilder().setCustomId('member_form').setTitle('Cerere de înscriere').addComponents(
        new ActionRowBuilder().addComponents(makeInput('member_id', 'ID IN-GAME', 'Introdu ID-ul in-game', true, undefined, 24)),
        new ActionRowBuilder().addComponents(makeInput('member_name', 'Numele + prenumele', 'Numele complet', true, undefined, 90)),
        new ActionRowBuilder().addComponents(makeInput('section', 'Secția (Los Santos)', 'Ex.: Los Santos', true, undefined, 60)),
        new ActionRowBuilder().addComponents(makeInput('discord_id', 'Discord ID', 'Introdu Discord ID-ul numeric', true, undefined, 24)),
        new ActionRowBuilder().addComponents(makeInput('rehire', 'Are reintegrare valabilă? (DA/NU)', 'DA sau NU', true, 'NU', 4)),
      );
      await interaction.showModal(modal);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId === 'member_form') {
      if (!canSubmit(interaction)) {
        await interaction.reply({ content: 'Nu ai permisiunea necesară pentru a trimite cererea.', ephemeral: true });
        return;
      }
      const form = {
        memberId: interaction.fields.getTextInputValue('member_id').trim(),
        name: interaction.fields.getTextInputValue('member_name').trim(),
        section: interaction.fields.getTextInputValue('section').trim(),
        discordId: interaction.fields.getTextInputValue('discord_id').trim(),
        rehire: interaction.fields.getTextInputValue('rehire').trim().toLocaleLowerCase('ro'),
      };
      if (!/^\d+$/.test(form.memberId) || form.memberId === '0') {
        await interaction.reply({ content: form.memberId === '0' ? 'ID in-game invalid pentru înscriere.' : 'ID-ul in-game trebuie să fie numeric.', ephemeral: true });
        return;
      }
      if (roleIds('BLACKLIST_IDS').includes(form.memberId)) {
        await interaction.reply({ content: 'Persoana are blacklist și nu poate fi înscrisă.', ephemeral: true });
        return;
      }
      if (!/^\d{15,25}$/.test(form.discordId)) {
        await interaction.reply({ content: 'Introdu un Discord ID numeric valid pentru persoană.', ephemeral: true });
        return;
      }
      if (!['da', 'nu', 'yes', 'no'].includes(form.rehire)) {
        await interaction.reply({ content: 'La reintegrare, răspunde doar cu DA sau NU.', ephemeral: true });
        return;
      }
      await interaction.deferReply({ ephemeral: true });
      const reviewChannel = await ensureReviewChannel(interaction.guild);
      const mentionedUserIds = [...new Set([form.discordId, interaction.user.id])];
      const reviewMessage = await reviewChannel.send({
        content: roleIds('HR_REVIEW_ROLE_IDS').map((id) => `<@&${id}>`).join(' '),
        embeds: [applicationEmbed(form, interaction.user)],
        components: [applicationButtons(false, ['da', 'yes'].includes(form.rehire))],
        allowedMentions: { users: mentionedUserIds, roles: [...new Set(roleIds('HR_REVIEW_ROLE_IDS'))] },
      });
      await interaction.editReply(`✅ Cererea ta a fost trimisă către HR: ${reviewChannel}. Vei primi un mesaj după verificare.`);
      console.log(`Cerere ${reviewMessage.id} trimisă de ${interaction.user.tag}`);
      return;
    }

    if (interaction.isButton() && [ACCEPT_BUTTON, REJECT_BUTTON].includes(interaction.customId)) {
      if (!isReviewChannel(interaction)) {
        await interaction.reply({ content: 'Acest buton poate fi folosit doar în canalul privat HR.', ephemeral: true });
        return;
      }
      if (!canReview(interaction)) {
        await interaction.reply({ content: 'Doar membrii cu rol HR pot decide această cerere.', ephemeral: true });
        return;
      }
      if (interaction.customId === ACCEPT_BUTTON) {
        const form = getFormFromMessage(interaction.message);
        const reviewMessageId = interaction.message.id;
        if (lockedApplications.has(reviewMessageId)) {
          await interaction.reply({ content: 'Un HR procesează deja această cerere.', ephemeral: true });
          return;
        }
        if (!getField(interaction.message.embeds[0], 'Status').startsWith('🟠')) {
          await interaction.reply({ content: 'Cererea a fost deja soluționată.', ephemeral: true });
          return;
        }
        lockedApplications.add(reviewMessageId);
        await interaction.deferReply({ ephemeral: true });
        try {
          if (form.rehire === 'da') {
            const { previousGrade, assignedGrade, rowNumber } = await lookupReintegrationGrade(form.memberId, form.discordId);
            await completeApproval(interaction, interaction.message, form, assignedGrade, previousGrade, rowNumber);
          } else {
            await completeApproval(interaction, interaction.message, form, 'Cadet');
          }
        } finally {
          lockedApplications.delete(reviewMessageId);
        }
        return;
      }
      const currentStatus = getField(interaction.message.embeds[0], 'Status');
      if (!currentStatus.startsWith('🟠')) {
        await interaction.reply({ content: 'Cererea a fost deja soluționată.', ephemeral: true });
        return;
      }
      const updated = updatedDecisionEmbed(interaction.message.embeds[0], 'Respinsă', interaction.user);
      await interaction.update({ embeds: [updated], components: [applicationButtons(true)] });
      return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith(ASSIGN_PREFIX)) {
      if (!isReviewChannel(interaction)) {
        await interaction.reply({ content: 'Alege gradul din meniul deschis în canalul privat HR.', ephemeral: true });
        return;
      }
      if (!canReview(interaction)) {
        await interaction.reply({ content: 'Doar membrii cu rol HR pot decide această cerere.', ephemeral: true });
        return;
      }
      const reviewMessageId = interaction.customId.slice(ASSIGN_PREFIX.length);
      if (lockedApplications.has(reviewMessageId)) {
        await interaction.reply({ content: 'Un HR procesează deja această cerere.', ephemeral: true });
        return;
      }
      lockedApplications.add(reviewMessageId);
      await interaction.deferReply({ ephemeral: true });
      try {
        const reviewChannel = await ensureReviewChannel(interaction.guild);
        const message = await reviewChannel.messages.fetch(reviewMessageId);
        const embed = message.embeds[0];
        if (!getField(embed, 'Status').startsWith('🟠')) throw new Error('Cererea a fost deja soluționată.');
        const form = getFormFromMessage(message);
        if (form.rehire === 'da') throw new Error('Reintegrarea primește grad automat din fila Reintegrare. Redeschide cererea și apasă Aprobă reintegrarea.');
        const rank = interaction.values[0];
        await completeApproval(interaction, message, form, rank);
      } finally {
        lockedApplications.delete(reviewMessageId);
      }
    }
  } catch (error) {
    console.error('Eroare la procesarea interacțiunii:', error);
    const message = error.message || 'A apărut o eroare la procesarea cererii.';
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: message, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
    }
  }
});

async function getSheetsApi() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_FILE || './service-account.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

function normalizeExamValue(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ro-RO')
    .replace(/[*_`\[\]]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function parseInstructorExamMessage(message) {
  const text = [message.content, ...message.embeds.flatMap((embed) => [
    embed.title ?? '', embed.description ?? '',
    ...(embed.fields ?? []).flatMap((field) => [field.name, field.value]),
  ])]
    .filter(Boolean)
    .join('\n')
    .replace(/[*_`~]/g, '');
  const labels = ['Nume instructor', 'ID in-game', 'ID', 'Callsign candidat', 'Callsign', 'Nume', 'Proba sustinuta', 'Rezultat'];
  const escapedLabels = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const labelPattern = new RegExp(`(?:^|[\\n\\r]|(?<=\\s))\\s*(?:\\d+[.)]\\s*)?(${escapedLabels.join('|')})\\s*:\\s*`, 'gi');
  const values = new Map();
  const matches = [...text.matchAll(labelPattern)];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const valueStart = match.index + match[0].length;
    const valueEnd = matches[index + 1]?.index ?? text.length;
    values.set(normalizeExamValue(match[1]), text.slice(valueStart, valueEnd).trim());
  }

  const candidateCallsign = values.get('callsign candidat') ?? '';
  const candidate = candidateCallsign || values.get('nume') || values.get('callsign') || '';
  const testName = values.get('proba sustinuta') ?? '';
  const result = normalizeExamValue(values.get('rezultat')).match(/^(admis|respins|confiscat)\b/i)?.[1]?.toLocaleUpperCase('ro-RO') ?? '';
  if (!values.has('nume instructor') || !candidate || !testName || !result) return null;

  const normalizedTest = normalizeExamValue(testName).replace(/[^a-z0-9]/g, '');
  const certificateKey = normalizedTest.includes('radio') ? 'radio'
    : normalizedTest.includes('mdt') ? 'mdt'
      : normalizedTest.includes('moto') ? 'moto'
        : normalizedTest.includes('pilot') || normalizedTest.includes('heli') ? 'pilot'
          : normalizedTest === 'hs' || normalizedTest.includes('highspeed') ? 'hs' : null;
  if (!certificateKey) return { result, candidate, certificateKey: null };
  return {
    result,
    candidate,
    certificateKey,
    explicitId: values.get('id in-game') ?? values.get('id') ?? '',
    explicitCallsign: candidateCallsign || values.get('callsign') || '',
  };
}

async function processInstructorExamMessage(message) {
  if (message.channelId !== INSTRUCTOR_EXAM_CHANNEL_ID || message.author.id === client.user?.id) return;
  console.log(`Mesaj primit în canalul de certificate: ${message.id} (text: ${message.content.length} caractere, embed-uri: ${message.embeds.length}).`);
  const form = parseInstructorExamMessage(message);
  if (!form) {
    console.warn(`Formatul mesajului ${message.id} nu corespunde modelului de certificat.`);
    await message.react('⚠️').catch(() => {});
    return;
  }
  if (form.result === 'RESPINS') {
    console.log(`Proba respinsă: mesaj ${message.id}; nu s-a modificat Google Sheets.`);
    await message.react('✅').catch(() => {});
    return;
  }
  if (!form.certificateKey) {
    console.warn(`Proba admisă cu certificat necunoscut în mesajul ${message.id}; nu s-a modificat Google Sheets.`);
    await message.react('⚠️').catch(() => {});
    return;
  }

  const sheets = await getSheetsApi();
  const spreadsheetId = required('GOOGLE_SPREADSHEET_ID');
  const range = `${quoteTab('MEMBRII POLITIE')}!A7:C348`;
  const members = await sheets.spreadsheets.values.get({
    spreadsheetId, range, valueRenderOption: 'FORMATTED_VALUE',
  });
  const memberRows = members.data.values ?? [];
  const findMatchingRows = (candidate, columnIndexes) => {
    const key = normalizeExamValue(candidate);
    if (!key) return [];
    return memberRows.flatMap((row, offset) => columnIndexes.some((index) => normalizeExamValue(row[index]) === key)
      ? [{ rowNumber: offset + 7, id: row[0] ?? '', callsign: row[1] ?? '', name: row[2] ?? '' }]
      : []);
  };
  const bracketId = form.candidate.match(/^\s*\[(\d+)\]/)?.[1] ?? '';
  const matchingRows = findMatchingRows(form.explicitId, [0]).length
    ? findMatchingRows(form.explicitId, [0])
    : findMatchingRows(form.explicitCallsign, [0, 1]).length
      ? findMatchingRows(form.explicitCallsign, [0, 1])
      : findMatchingRows(bracketId, [0, 1]).length
        ? findMatchingRows(bracketId, [0, 1])
        : findMatchingRows(form.candidate, [0, 1, 2]);
  if (matchingRows.length !== 1) {
    console.warn(`Membrul „${form.candidate}” nu a fost identificat unic în MEMBRII POLITIE (mesaj ${message.id}); nu s-a modificat foaia.`);
    await message.react('⚠️').catch(() => {});
    return;
  }

  const member = matchingRows[0];
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: [`${quoteTab('MEMBRII POLITIE')}!M${member.rowNumber}:Q${member.rowNumber}`],
    includeGridData: true,
    fields: 'sheets(properties(sheetId,title),data(rowData(values(dataValidation,userEnteredValue,effectiveValue))))',
  });
  const memberSheet = (meta.data.sheets ?? []).find((sheet) => sheet.properties.title === 'MEMBRII POLITIE');
  const targetIndex = INSTRUCTOR_EXAM_CERTIFICATES[form.certificateKey].column - 13;
  const cell = memberSheet?.data?.[0]?.rowData?.[0]?.values?.[targetIndex];
  if (cell?.dataValidation?.condition?.type !== 'BOOLEAN') {
    console.warn(`Celula pentru ${INSTRUCTOR_EXAM_CERTIFICATES[form.certificateKey].label} din rândul ${member.rowNumber} nu este checkbox; nu s-a modificat foaia.`);
    await message.react('⚠️').catch(() => {});
    return;
  }
  const shouldCheck = form.result === 'ADMIS';
  const currentlyChecked = cell.userEnteredValue?.boolValue === true || cell.effectiveValue?.boolValue === true;
  if (currentlyChecked === shouldCheck) {
    console.log(`${member.callsign || member.name} avea deja checkboxul ${INSTRUCTOR_EXAM_CERTIFICATES[form.certificateKey].label} în starea cerută de ${form.result}.`);
    await message.react('✅').catch(() => {});
    return;
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        updateCells: {
          range: {
            sheetId: memberSheet.properties.sheetId,
            startRowIndex: member.rowNumber - 1,
            endRowIndex: member.rowNumber,
            startColumnIndex: INSTRUCTOR_EXAM_CERTIFICATES[form.certificateKey].column - 1,
            endColumnIndex: INSTRUCTOR_EXAM_CERTIFICATES[form.certificateKey].column,
          },
          rows: [{ values: [{ userEnteredValue: { boolValue: shouldCheck } }] }],
          fields: 'userEnteredValue',
        },
      }],
    },
  });
  console.log(`✅ Rezultat ${form.result}: ${member.callsign || member.name}, ${INSTRUCTOR_EXAM_CERTIFICATES[form.certificateKey].label}; checkbox ${shouldCheck ? 'bifat' : 'debifat'} (rând ${member.rowNumber}).`);
  await message.react('✅').catch(() => {});
}

client.on(Events.MessageCreate, (message) => {
  void processInstructorExamMessage(message).catch((error) => {
    console.error(`Eroare la procesarea rezultatului de instructor (mesaj ${message.id}):`, error.message);
    void message.react('⚠️').catch(() => {});
  });
});

async function ensureInstructorCertificateHeaders(sheets, spreadsheetId, certificate) {
  const range = `${quoteTab('Instructori')}!${certificate.startColumn}${certificate.headerRow}:${certificate.endColumn}${certificate.labelsRow}`;
  const result = await sheets.spreadsheets.values.get({ spreadsheetId, range, valueRenderOption: 'FORMATTED_VALUE' });
  const rows = result.data.values ?? [];
  const title = certificate.sheetTitle ?? certificate.label;
  const actualTitle = String(rows[0]?.[0] ?? '').trim();
  const expectedHeaders = ['ID', 'CS', 'NUME', 'ID DISCORD'];
  const actualHeaders = Array.from({ length: 4 }, (_, index) => String(rows[1]?.[index] ?? '').trim());
  if (!actualTitle && actualHeaders.every((value) => !value)) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: [
          { range: `${quoteTab('Instructori')}!${certificate.startColumn}${certificate.headerRow}`, values: [[title]] },
          { range: `${quoteTab('Instructori')}!${certificate.startColumn}${certificate.labelsRow}:${certificate.endColumn}${certificate.labelsRow}`, values: [expectedHeaders] },
        ],
      },
    });
    return;
  }
  if (normalizeGrade(actualTitle) !== normalizeGrade(title)
      || actualHeaders.some((value, index) => normalizeGrade(value) !== normalizeGrade(expectedHeaders[index]))) {
    throw new Error(`Tabelul ${certificate.label} din fila Instructori nu are antetele așteptate; nu am modificat zona.`);
  }
}

async function addInstructorFromCommand(interaction, memberId, certificateKey) {
  if (!/^\d+$/.test(memberId) || memberId === '0') throw new Error('ID-ul membrului trebuie să fie numeric.');
  const certificate = INSTRUCTOR_CERTIFICATES[certificateKey];
  if (!certificate) throw new Error('Certificatul selectat nu este configurat.');

  const instructorSefRoleId = process.env.DISCORD_ROLE_INSTRUCTOR_SEF_ID?.trim();
  if (!instructorSefRoleId) throw new Error('Lipsește DISCORD_ROLE_INSTRUCTOR_SEF_ID din .env.');
  const caller = await interaction.guild.members.fetch(interaction.user.id);
  if (!caller.roles.cache.has(instructorSefRoleId)) {
    throw new Error('Doar membrii cu rolul INSTRUCTOR ȘEF pot adăuga INSTRUCTORI.');
  }

  const sheets = await getSheetsApi();
  const spreadsheetId = required('GOOGLE_SPREADSHEET_ID');
  await ensureInstructorCertificateHeaders(sheets, spreadsheetId, certificate);
  const instructorTab = quoteTab('Instructori');
  const tableStartRow = certificate.firstDataRow;
  const tableEndRow = certificate.lastDataRow;
  const instructorGroup = `${instructorTab}!${certificate.startColumn}${tableStartRow}:${certificate.endColumn}${tableEndRow}`;
  const groupResult = await sheets.spreadsheets.values.get({ spreadsheetId, range: instructorGroup, valueRenderOption: 'FORMATTED_VALUE' });
  const groupRows = groupResult.data.values ?? [];
  const startOffset = certificate.startColumn.charCodeAt(0);
  const idOffset = certificate.idColumn.charCodeAt(0) - startOffset;
  const discordOffset = certificate.discordColumn.charCodeAt(0) - startOffset;
  const leaderIndex = groupRows.findIndex((row) => row.some((value) => String(value ?? '').trim()));
  const leaderDiscordId = leaderIndex < 0 ? '' : String(groupRows[leaderIndex][discordOffset] ?? '').trim();
  if (!leaderDiscordId) throw new Error(`Primul rând din lista ${certificate.label} nu are Discord ID. Completează-l înainte să folosești comanda.`);
  if (interaction.user.id !== leaderDiscordId) {
    throw new Error(`Doar INSTRUCTORUL-ȘEF aflat primul în lista ${certificate.label} poate folosi această comandă.`);
  }
  if (['tester_pd', 'hr'].includes(certificateKey)) {
    const nameOffset = certificate.nameColumn.charCodeAt(0) - startOffset;
    const leaderRow = groupRows[leaderIndex] ?? [];
    if (!normalizeGrade(leaderRow[nameOffset]).includes('sef')) {
      throw new Error(`Pentru ${certificate.label}, doar INSTRUCTORUL-ȘEF care are „Șef” în nume pe fila Instructori poate adăuga INSTRUCTORI.`);
    }
  }

  const mainTab = quoteTab(required('GOOGLE_MAIN_SHEET_NAME'));
  const rosterResult = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: [`${mainTab}!A:A`, `${mainTab}!B:B`, `${mainTab}!C:C`, `${mainTab}!T:T`],
    valueRenderOption: 'FORMATTED_VALUE',
  });
  const [ids = [], callsigns = [], names = [], discordIds = []] = (rosterResult.data.valueRanges ?? []).map((item) => item.values ?? []);
  const matchingRows = [];
  for (let index = 0; index < ids.length; index += 1) {
    if (String(ids[index]?.[0] ?? '').trim() === memberId) matchingRows.push(index);
  }
  if (matchingRows.length === 0) throw new Error(`ID-ul ${memberId} nu există în lista principală de membri.`);
  if (matchingRows.length > 1) throw new Error(`ID-ul ${memberId} apare de mai multe ori în lista principală. Corectează duplicatul înainte să-l adaugi.`);
  const memberRowIndex = matchingRows[0];
  const callsign = String(callsigns[memberRowIndex]?.[0] ?? '').trim();
  const name = String(names[memberRowIndex]?.[0] ?? '').trim();
  const discordId = String(discordIds[memberRowIndex]?.[0] ?? '').trim();
  if (!name || !/^\d{15,25}$/.test(discordId)) {
    throw new Error(`Lipsesc numele sau Discord ID-ul membrului ${memberId} din foaia principală.`);
  }

  for (const row of groupRows) {
    if (String(row[idOffset] ?? '').trim() === memberId || String(row[discordOffset] ?? '').trim() === discordId) {
      throw new Error(`Membrul ${memberId} este deja trecut la ${certificate.label}.`);
    }
  }
  const emptyOffset = Array.from({ length: tableEndRow - tableStartRow + 1 }, (_, index) => index)
    .find((index) => (groupRows[index] ?? []).every((value) => !String(value ?? '').trim()));
  if (emptyOffset === undefined) throw new Error(`Nu mai este loc în lista pentru ${certificate.label}.`);
  const targetRow = tableStartRow + emptyOffset;

  const roleId = process.env[certificate.roleSetting]?.trim();
  if (!roleId) throw new Error(`Lipsește ${certificate.roleSetting} din .env.`);
  const assignDiscordRole = await prepareInstructorRoleAssignment(interaction.guild, discordId, roleId, certificate.label);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${instructorTab}!${certificate.startColumn}${targetRow}:${certificate.endColumn}${targetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[memberId, callsign, name, discordId]] },
  });
  try {
    const roleName = await assignDiscordRole(`${certificate.label} adăugat de instructorul-șef`);
    return `✅ ${name} a fost adăugat la **${certificate.label}** (rândul ${targetRow}) și a primit rolul Discord **${roleName}**.`;
  } catch (error) {
    console.error('Instructorul a fost trecut în Sheets, dar rolul Discord nu a putut fi acordat:', error);
    return `⚠️ ${name} a fost trecut în fila **Instructori**, dar rolul Discord nu a putut fi acordat: ${error.message}`;
  }
}

async function prepareInstructorRoleAssignment(guild, discordId, roleId, label) {
  const botMember = guild.members.me ?? await guild.members.fetchMe();
  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new Error('Botul are nevoie de Manage Roles ca să acorde rolul de INSTRUCTOR pe Discord.');
  }
  const role = await guild.roles.fetch(roleId).catch(() => null);
  if (!role) throw new Error(`Rolul Discord pentru ${label} nu a fost găsit.`);
  if (role.managed || botMember.roles.highest.comparePositionTo(role) <= 0) {
    throw new Error(`Mută rolul botului deasupra rolului „${role.name}” în setările serverului.`);
  }
  const member = await guild.members.fetch(discordId).catch(() => null);
  if (!member) throw new Error('Membrul nu este în serverul Discord selectat.');
  if (member.id === guild.ownerId || botMember.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
    throw new Error('Botul nu poate acorda rolul acestui membru din cauza ierarhiei rolurilor.');
  }
  return async (reason) => {
    if (!member.roles.cache.has(role.id)) await member.roles.add(role, reason);
    return role.name;
  };
}

async function prepareInstructorRoleRemoval(guild, discordId, roleId, label) {
  const botMember = guild.members.me ?? await guild.members.fetchMe();
  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new Error('Botul are nevoie de Manage Roles ca să retragă rolul de INSTRUCTOR pe Discord.');
  }
  const role = await guild.roles.fetch(roleId).catch(() => null);
  if (!role) throw new Error(`Rolul Discord pentru ${label} nu a fost găsit.`);
  if (role.managed || botMember.roles.highest.comparePositionTo(role) <= 0) {
    throw new Error(`Mută rolul botului deasupra rolului „${role.name}” în setările serverului.`);
  }
  const member = await guild.members.fetch(discordId).catch(() => null);
  if (!member) throw new Error('Membrul nu este în serverul Discord selectat.');
  if (member.id === guild.ownerId || botMember.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
    throw new Error('Botul nu poate retrage rolul acestui membru din cauza ierarhiei rolurilor.');
  }
  return async (reason) => {
    if (member.roles.cache.has(role.id)) await member.roles.remove(role, reason);
    return role.name;
  };
}

async function removeInstructorFromCommand(interaction, memberId, certificateKey) {
  if (!/^\d+$/.test(memberId) || memberId === '0') throw new Error('ID-ul membrului trebuie să fie numeric.');
  const certificate = INSTRUCTOR_CERTIFICATES[certificateKey];
  if (!certificate) throw new Error('Certificatul selectat nu este configurat.');
  const instructorSefRoleId = process.env.DISCORD_ROLE_INSTRUCTOR_SEF_ID?.trim();
  if (!instructorSefRoleId) throw new Error('Lipsește DISCORD_ROLE_INSTRUCTOR_SEF_ID din .env.');
  const caller = await interaction.guild.members.fetch(interaction.user.id);
  if (!caller.roles.cache.has(instructorSefRoleId)) {
    throw new Error('Doar membrii cu rolul INSTRUCTOR ȘEF pot elimina INSTRUCTORI.');
  }

  const sheets = await getSheetsApi();
  const spreadsheetId = required('GOOGLE_SPREADSHEET_ID');
  await ensureInstructorCertificateHeaders(sheets, spreadsheetId, certificate);
  const instructorTab = quoteTab('Instructori');
  const startRow = certificate.firstDataRow;
  const endRow = certificate.lastDataRow;
  const groupResult = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${instructorTab}!${certificate.startColumn}${startRow}:${certificate.endColumn}${endRow}`,
    valueRenderOption: 'FORMATTED_VALUE',
  });
  const rows = groupResult.data.values ?? [];
  const startColumn = certificate.startColumn.charCodeAt(0);
  const idOffset = certificate.idColumn.charCodeAt(0) - startColumn;
  const discordOffset = certificate.discordColumn.charCodeAt(0) - startColumn;
  const leaderIndex = rows.findIndex((row) => row.some((value) => String(value ?? '').trim()));
  const leaderDiscordId = leaderIndex < 0 ? '' : String(rows[leaderIndex][discordOffset] ?? '').trim();
  if (!leaderDiscordId) throw new Error(`Primul rând din lista ${certificate.label} nu are Discord ID.`);
  if (interaction.user.id !== leaderDiscordId) {
    throw new Error(`Doar INSTRUCTORUL-ȘEF aflat primul în lista ${certificate.label} poate folosi această comandă.`);
  }
  if (['tester_pd', 'hr'].includes(certificateKey)) {
    const nameOffset = certificate.nameColumn.charCodeAt(0) - startColumn;
    if (!normalizeGrade(rows[leaderIndex]?.[nameOffset]).includes('sef')) {
      throw new Error(`Pentru ${certificate.label}, doar INSTRUCTORUL-ȘEF care are „Șef” în nume pe fila Instructori poate elimina INSTRUCTORI.`);
    }
  }

  const matches = rows.map((row, index) => ({ row, index }))
    .filter(({ row }) => String(row[idOffset] ?? '').trim() === memberId);
  if (matches.length === 0) throw new Error(`ID-ul ${memberId} nu este în lista ${certificate.label}.`);
  if (matches.length > 1) throw new Error(`ID-ul ${memberId} apare de mai multe ori în lista ${certificate.label}; corectează duplicatele înainte de eliminare.`);
  const { row: removedRow, index: removedIndex } = matches[0];
  const targetDiscordId = String(removedRow[discordOffset] ?? '').trim();
  if (!/^\d{15,25}$/.test(targetDiscordId)) throw new Error(`Rândul membrului ${memberId} nu conține un Discord ID valid.`);
  const roleId = process.env[certificate.roleSetting]?.trim();
  if (!roleId) throw new Error(`Lipsește ${certificate.roleSetting} din .env.`);
  const removeRole = await prepareInstructorRoleRemoval(interaction.guild, targetDiscordId, roleId, certificate.label);
  const compactRows = rows.filter((_, index) => index !== removedIndex)
    .filter((row) => row.some((value) => String(value ?? '').trim()))
    .map((row) => Array.from({ length: 4 }, (_, index) => String(row[index] ?? '').trim()));
  const rowCount = endRow - startRow + 1;
  const outputRows = Array.from({ length: rowCount }, (_, index) => compactRows[index] ?? ['', '', '', '']);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${instructorTab}!${certificate.startColumn}${startRow}:${certificate.endColumn}${endRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: outputRows },
  });
  try {
    const roleName = await removeRole(`${certificate.label} eliminat de instructorul-șef`);
    return `✅ ${removedRow[2] || memberId} a fost eliminat din **${certificate.label}** și i-a fost retras rolul Discord **${roleName}**.`;
  } catch (error) {
    console.error('Instructorul a fost eliminat din Sheets, dar rolul Discord nu a putut fi retras:', error);
    return `⚠️ ${removedRow[2] || memberId} a fost eliminat din fila **Instructori**, dar rolul Discord nu a putut fi retras: ${error.message}`;
  }
}

async function removeInstructorSefFromCommand(interaction, memberId, certificateKey) {
  if (!/^\d+$/.test(memberId) || memberId === '0') throw new Error('ID-ul membrului trebuie să fie numeric.');
  const certificate = INSTRUCTOR_CERTIFICATES[certificateKey];
  if (!certificate) throw new Error('Certificatul selectat nu este configurat.');
  const chestorGeneralRoleId = process.env.DISCORD_ROLE_CHESTOR_GENERAL_ID?.trim();
  if (!chestorGeneralRoleId) throw new Error('Lipsește DISCORD_ROLE_CHESTOR_GENERAL_ID din .env.');
  const caller = await interaction.guild.members.fetch(interaction.user.id);
  if (!caller.roles.cache.has(chestorGeneralRoleId)) {
    throw new Error('Doar membrii cu rolul Chestor General pot elimina INSTRUCTORI ȘEFI.');
  }

  const sheets = await getSheetsApi();
  const spreadsheetId = required('GOOGLE_SPREADSHEET_ID');
  await ensureInstructorCertificateHeaders(sheets, spreadsheetId, certificate);
  const instructorTab = quoteTab('Instructori');
  const startRow = certificate.firstDataRow;
  const endRow = certificate.lastDataRow;
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${instructorTab}!${certificate.startColumn}${startRow}:${certificate.endColumn}${endRow}`,
    valueRenderOption: 'FORMATTED_VALUE',
  });
  const rows = result.data.values ?? [];
  const startColumn = certificate.startColumn.charCodeAt(0);
  const idOffset = certificate.idColumn.charCodeAt(0) - startColumn;
  const discordOffset = certificate.discordColumn.charCodeAt(0) - startColumn;
  const matches = rows.map((row, index) => ({ row, index }))
    .filter(({ row }) => String(row[idOffset] ?? '').trim() === memberId);
  if (matches.length === 0) throw new Error(`ID-ul ${memberId} nu este în lista ${certificate.label}.`);
  if (matches.length > 1) throw new Error(`ID-ul ${memberId} apare de mai multe ori în lista ${certificate.label}; corectează duplicatele înainte de eliminare.`);
  const { row: removedRow, index: removedIndex } = matches[0];
  const targetDiscordId = String(removedRow[discordOffset] ?? '').trim();
  if (!/^\d{15,25}$/.test(targetDiscordId)) throw new Error(`Rândul membrului ${memberId} nu conține un Discord ID valid.`);
  const roleSetting = 'DISCORD_ROLE_INSTRUCTOR_SEF_ID';
  const roleId = process.env[roleSetting]?.trim();
  if (!roleId) throw new Error(`Lipsește ${roleSetting} din .env.`);
  const removeRole = await prepareInstructorRoleRemoval(interaction.guild, targetDiscordId, roleId, 'INSTRUCTOR ȘEF');
  const compactRows = rows.filter((_, index) => index !== removedIndex)
    .filter((row) => row.some((value) => String(value ?? '').trim()))
    .map((row) => Array.from({ length: 4 }, (_, index) => String(row[index] ?? '').trim()));
  const rowCount = endRow - startRow + 1;
  const outputRows = Array.from({ length: rowCount }, (_, index) => compactRows[index] ?? ['', '', '', '']);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${instructorTab}!${certificate.startColumn}${startRow}:${certificate.endColumn}${endRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: outputRows },
  });
  try {
    const roleName = await removeRole('Grad de Instructor Șef retras de Chestor General');
    return `✅ ${removedRow[2] || memberId} a fost eliminat din **${certificate.label}** și i-a fost retras rolul Discord **${roleName}**.`;
  } catch (error) {
    console.error('Instructorul-șef a fost eliminat din Sheets, dar rolul Discord nu a putut fi retras:', error);
    return `⚠️ ${removedRow[2] || memberId} a fost eliminat din fila **Instructori**, dar rolul Discord nu a putut fi retras: ${error.message}`;
  }
}

async function addInstructorSefFromCommand(interaction, memberId, certificateKey) {
  if (!/^\d+$/.test(memberId) || memberId === '0') throw new Error('ID-ul membrului trebuie să fie numeric.');
  const certificate = INSTRUCTOR_CERTIFICATES[certificateKey];
  if (!certificate) throw new Error('Certificatul selectat nu este configurat.');
  const chestorGeneralRoleId = process.env.DISCORD_ROLE_CHESTOR_GENERAL_ID?.trim();
  if (!chestorGeneralRoleId) throw new Error('Lipsește DISCORD_ROLE_CHESTOR_GENERAL_ID din .env.');
  const caller = await interaction.guild.members.fetch(interaction.user.id);
  if (!caller.roles.cache.has(chestorGeneralRoleId)) {
    throw new Error('Doar membrii cu rolul Chestor General pot acorda gradul de INSTRUCTOR ȘEF.');
  }

  const sheets = await getSheetsApi();
  const spreadsheetId = required('GOOGLE_SPREADSHEET_ID');
  await ensureInstructorCertificateHeaders(sheets, spreadsheetId, certificate);
  const mainTab = quoteTab(required('GOOGLE_MAIN_SHEET_NAME'));
  const rosterResult = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: [`${mainTab}!A:A`, `${mainTab}!B:B`, `${mainTab}!C:C`, `${mainTab}!T:T`],
    valueRenderOption: 'FORMATTED_VALUE',
  });
  const [ids = [], callsigns = [], names = [], discordIds = []] = (rosterResult.data.valueRanges ?? []).map((item) => item.values ?? []);
  const matchingRows = [];
  for (let index = 0; index < ids.length; index += 1) {
    if (String(ids[index]?.[0] ?? '').trim() === memberId) matchingRows.push(index);
  }
  if (matchingRows.length === 0) throw new Error(`ID-ul ${memberId} nu există în lista principală de membri.`);
  if (matchingRows.length > 1) throw new Error(`ID-ul ${memberId} apare de mai multe ori în lista principală. Corectează duplicatul înainte să-l adaugi.`);
  const index = matchingRows[0];
  const targetDiscordId = String(discordIds[index]?.[0] ?? '').trim();
  const memberName = String(names[index]?.[0] ?? '').trim();
  const markedName = /\bsef\b/.test(normalizeGrade(memberName)) ? memberName : `${memberName} SEF`;
  const entry = [memberId, String(callsigns[index]?.[0] ?? '').trim(), markedName, targetDiscordId];
  if (!memberName || !/^\d{15,25}$/.test(targetDiscordId)) {
    throw new Error(`Lipsesc numele sau Discord ID-ul membrului ${memberId} din foaia principală.`);
  }

  const instructorTab = quoteTab('Instructori');
  const tableStartRow = certificate.firstDataRow;
  const tableEndRow = certificate.lastDataRow;
  const groupResult = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${instructorTab}!${certificate.startColumn}${tableStartRow}:${certificate.endColumn}${tableEndRow}`,
    valueRenderOption: 'FORMATTED_VALUE',
  });
  const width = certificate.endColumn.charCodeAt(0) - certificate.startColumn.charCodeAt(0) + 1;
  const currentRows = groupResult.data.values ?? [];
  const lastUsedIndex = currentRows.reduce((last, row, rowIndex) =>
    row.some((value) => String(value ?? '').trim()) ? rowIndex : last, -1);
  const idOffset = certificate.idColumn.charCodeAt(0) - certificate.startColumn.charCodeAt(0);
  const discordOffset = certificate.discordColumn.charCodeAt(0) - certificate.startColumn.charCodeAt(0);
  const existingRows = currentRows.slice(0, lastUsedIndex + 1)
    .map((row) => Array.from({ length: width }, (_, cellIndex) => String(row[cellIndex] ?? '').trim()))
    .filter((row) => row[idOffset] !== memberId && row[discordOffset] !== targetDiscordId);
  const updatedRows = [entry, ...existingRows];
  if (updatedRows.length > tableEndRow - tableStartRow + 1) throw new Error(`Nu mai este loc în lista pentru ${certificate.label}.`);
  const roleSetting = 'DISCORD_ROLE_INSTRUCTOR_SEF_ID';
  const roleId = process.env[roleSetting]?.trim();
  if (!roleId) throw new Error(`Lipsește ${roleSetting} din .env.`);
  const assignRole = await prepareInstructorRoleAssignment(interaction.guild, targetDiscordId, roleId, 'INSTRUCTOR ȘEF');

  const rowCount = Math.max(lastUsedIndex + 2, updatedRows.length);
  const outputRows = Array.from({ length: rowCount }, (_, rowIndex) =>
    updatedRows[rowIndex] ?? Array.from({ length: width }, () => ''));
  const lastRow = tableStartRow + rowCount - 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${instructorTab}!${certificate.startColumn}${tableStartRow}:${certificate.endColumn}${lastRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: outputRows },
  });
  try {
    const roleName = await assignRole('Grad de Instructor Șef acordat de Chestor General');
    return `✅ ${entry[2]} a fost pus primul la **${certificate.label}** și a primit rolul Discord **${roleName}**.`;
  } catch (error) {
    console.error('Instructorul-șef a fost trecut în Sheets, dar rolul Discord nu a putut fi acordat:', error);
    return `⚠️ ${entry[2]} a fost pus primul în fila **Instructori**, dar rolul Discord nu a putut fi acordat: ${error.message}`;
  }
}

async function lookupReintegrationGrade(memberId, discordId) {
  const sheets = await getSheetsApi();
  const spreadsheetId = required('GOOGLE_SPREADSHEET_ID');
  const range = `${quoteTab(REINTEGRATION_SHEET_NAME)}!A:E`;
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: 'FORMATTED_VALUE',
  });
  const rows = result.data.values ?? [];
  const matches = rows.flatMap((row, index) =>
    String(row[0] ?? '').trim() === String(memberId).trim() ? [{ rowNumber: index + 1, cells: row }] : []);
  if (matches.length === 0) {
    throw new Error(`Nu am găsit ID-ul de joc ${memberId} în coloana A din fila „${REINTEGRATION_SHEET_NAME}”. Reintegrarea nu a fost aprobată.`);
  }
  if (matches.length > 1) {
    throw new Error(`ID-ul de joc ${memberId} apare de mai multe ori în fila „${REINTEGRATION_SHEET_NAME}”. HR trebuie să corecteze înregistrările înainte de aprobare.`);
  }
  const cells = matches[0].cells;
  const reintegrationDiscordId = String(cells[1] ?? '').trim();
  if (!reintegrationDiscordId || reintegrationDiscordId !== String(discordId).trim()) {
    throw new Error(`Discord ID-ul din coloana B a filei „${REINTEGRATION_SHEET_NAME}” nu corespunde formularului pentru ID-ul ${memberId}. Cererea a rămas în așteptare, iar datele nu au fost șterse.`);
  }
  const previousGrade = [cells[3], cells[4]].filter(Boolean).join(' ').trim();
  const assignedGrade = automaticReintegrationGrade(previousGrade);
  if (!assignedGrade) {
    throw new Error(`Gradul din D+E („${previousGrade || 'gol'}”) nu are regulă automată de reintegrare. Cererea a rămas în așteptarea HR.`);
  }
  return { previousGrade, assignedGrade, rowNumber: matches[0].rowNumber };
}

async function completeApproval(interaction, reviewMessage, form, rank, previousGrade = '', reintegrationRowNumber = null) {
  const applyDiscordUpdate = await prepareDiscordMemberUpdate(interaction.guild, form, rank);
  const callSign = await addMemberToSheets(form, rank);
  let reintegrationWarning = '';
  if (reintegrationRowNumber !== null) {
    try {
      await clearReintegrationEntry(form.memberId, form.discordId, reintegrationRowNumber);
    } catch (error) {
      console.error('Membrul a fost adăugat, dar înregistrarea din Reintegrare nu a putut fi ștearsă:', error);
      reintegrationWarning = `\n⚠️ Membrul a fost adăugat, dar rândul ${reintegrationRowNumber} din fila Reintegrare nu a putut fi șters: ${error.message}`;
    }
  }
  let discordWarning = '';
  try {
    await applyDiscordUpdate(callSign);
  } catch (discordError) {
    console.error('Înscrierea a fost salvată, dar actualizarea rolului/nickname-ului Discord a eșuat:', discordError);
    discordWarning = `\n⚠️ Înscrierea a fost salvată în Sheets, dar rolul sau nickname-ul Discord nu s-a putut actualiza: ${discordError.message}`;
  }
  const finalEmbed = updatedDecisionEmbed(reviewMessage.embeds[0], 'Aprobat', interaction.user, rank, previousGrade)
    .addFields({ name: 'Callsign alocat', value: callSign || 'Necompletat', inline: true });
  if (reintegrationRowNumber !== null && !reintegrationWarning) {
    finalEmbed.addFields({ name: 'Fila Reintegrare', value: `Înregistrarea ID-ului și Discord ID-ului a fost ștearsă (rândul ${reintegrationRowNumber}).`, inline: false });
  }
  await reviewMessage.edit({ embeds: [finalEmbed], components: [applicationButtons(true)] });
  let webhookWarning = '';
  try {
    await sendCallsignWebhook(form, callSign, rank);
  } catch (webhookError) {
    console.error('Membrul a fost înscris, dar webhook-ul de callsign a eșuat:', webhookError);
    webhookWarning = '\n⚠️ Înscrierea a fost salvată, dar mesajul webhook nu a putut fi trimis. Verifică CALLSIGN_WEBHOOK_URL.';
  }
  await interaction.editReply(`✅ Cererea a fost aprobată ca **${rank}**${previousGrade ? ` (grad anterior: **${previousGrade}**)` : ''}. Callsign: **${callSign || 'necompletat'}**. Discord: ${discordWarning ? 'verifică avertismentul de mai jos' : 'rolul și nickname-ul au fost actualizate'}${reintegrationWarning}${discordWarning}${webhookWarning}`);
}

async function clearReintegrationEntry(memberId, discordId, rowNumber) {
  const sheets = await getSheetsApi();
  const spreadsheetId = required('GOOGLE_SPREADSHEET_ID');
  const range = `${quoteTab(REINTEGRATION_SHEET_NAME)}!A${rowNumber}:E${rowNumber}`;
  const result = await sheets.spreadsheets.values.get({ spreadsheetId, range, valueRenderOption: 'FORMATTED_VALUE' });
  const current = result.data.values?.[0] ?? [];
  if (String(current[0] ?? '').trim() !== String(memberId).trim()
      || String(current[1] ?? '').trim() !== String(discordId).trim()) {
    throw new Error('Rândul nu mai corespunde ID-ului in-game și Discord ID-ului aprobate.');
  }
  await sheets.spreadsheets.values.clear({ spreadsheetId, range });
}

async function prepareDiscordMemberUpdate(guild, form, rank) {
  const targetGrade = UPDOWN_RANK_ORDER.find((grade) => normalizeGrade(grade) === normalizeGrade(rank));
  const targetRoleSetting = targetGrade ? UPDOWN_ROLE_SETTINGS[targetGrade] : '';
  if (!targetRoleSetting) throw new Error(`Nu există mapare Discord pentru gradul ${rank}.`);
  const rankRoleIds = Object.fromEntries(Object.entries(UPDOWN_ROLE_SETTINGS).map(([name, setting]) => {
    const id = process.env[setting]?.trim();
    if (!id) throw new Error(`Completează ${setting} cu ID-ul rolului Discord pentru ${name}.`);
    return [name, id];
  }));
  if (new Set(Object.values(rankRoleIds)).size !== Object.keys(rankRoleIds).length) {
    throw new Error('Fiecare grad trebuie să aibă un ID de rol Discord diferit în .env.');
  }
  const bonusRoleIds = Object.fromEntries(UPDOWN_BONUS_ROLES.map((bonus) => {
    const id = process.env[bonus.roleSetting]?.trim();
    if (!id) throw new Error(`Completează ${bonus.roleSetting} cu ID-ul rolului ${bonus.label}.`);
    return [bonus.roleSetting, id];
  }));

  const botMember = guild.members.me ?? await guild.members.fetchMe();
  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new Error('Botul are nevoie de permisiunea Manage Roles pentru a acorda gradul.');
  }
  if (!botMember.permissions.has(PermissionFlagsBits.ManageNicknames)
      && !botMember.permissions.has(PermissionFlagsBits.Administrator)) {
    throw new Error('Botul are nevoie de permisiunea Manage Nicknames pentru a seta numele.');
  }

  const roles = new Map();
  for (const [name, id] of Object.entries(rankRoleIds)) {
    const role = await guild.roles.fetch(id).catch(() => null);
    if (!role) throw new Error(`Nu găsesc rolul Discord pentru ${name}; verifică ${UPDOWN_ROLE_SETTINGS[name]}.`);
    if (role.managed || botMember.roles.highest.comparePositionTo(role) <= 0) {
      throw new Error(`Mută rolul botului deasupra rolului „${role.name}” în setările serverului.`);
    }
    roles.set(name, role);
  }
  const bonusRoles = new Map();
  for (const bonus of UPDOWN_BONUS_ROLES) {
    const roleId = bonusRoleIds[bonus.roleSetting];
    const role = await guild.roles.fetch(roleId).catch(() => null);
    if (!role) throw new Error(`Nu găsesc rolul Discord ${bonus.label}; verifică ${bonus.roleSetting}.`);
    if (role.managed || botMember.roles.highest.comparePositionTo(role) <= 0) {
      throw new Error(`Mută rolul botului deasupra rolului „${role.name}” în setările serverului.`);
    }
    bonusRoles.set(bonus.roleSetting, role);
  }

  const shouldAddAdmissionRoles = rank === 'Cadet' || form.rehire === 'da';
  const admissionRoles = shouldAddAdmissionRoles
    ? await Promise.all(AUTO_ADMISSION_EXTRA_ROLE_IDS.map((id) => guild.roles.fetch(id).catch(() => null)))
    : [];
  if (admissionRoles.some((role) => !role)) {
    const missingIds = AUTO_ADMISSION_EXTRA_ROLE_IDS.filter((id, index) => !admissionRoles[index]);
    throw new Error(`Nu am găsit rolurile automate ${missingIds.join(', ')}. Verifică dacă sunt pe acest server.`);
  }

  const member = await guild.members.fetch(form.discordId).catch(() => null);
  if (!member) throw new Error('Utilizatorul cu Discord ID-ul din formular nu este în server.');
  if (member.id === guild.ownerId || botMember.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
    throw new Error('Botul nu poate schimba rolurile sau nickname-ul acestui membru din cauza ierarhiei rolurilor.');
  }

  for (const role of admissionRoles) {
    if (role.managed || botMember.roles.highest.comparePositionTo(role) <= 0) {
      throw new Error(`Mută rolul botului deasupra rolului „${role.name}” pentru acordarea automată.`);
    }
  }

  const targetRole = roles.get(targetGrade);
  const targetRankIndex = UPDOWN_RANK_ORDER.indexOf(targetGrade);
  const bonusRolesToKeep = UPDOWN_BONUS_ROLES
    .filter((bonus) => UPDOWN_RANK_ORDER.indexOf(bonus.threshold) <= targetRankIndex)
    .map((bonus) => bonusRoles.get(bonus.roleSetting));
  const retainedRoles = [...new Map([targetRole, ...bonusRolesToKeep, ...admissionRoles]
    .filter(Boolean).map((role) => [role.id, role])).values()];
  const retainedRoleIds = new Set(retainedRoles.map((role) => role.id));
  return async (callSign) => {
    let updatedMember = member;
    const rolesToAdd = retainedRoles.filter((role) => !updatedMember.roles.cache.has(role.id));
    if (rolesToAdd.length) {
      updatedMember = await updatedMember.roles.add(rolesToAdd, 'Grad și roluri acordate automat după aprobarea HR');
    }
    const refreshedMember = await guild.members.fetch({ user: form.discordId, force: true });
    const missingRoleNames = retainedRoles.filter((role) => !refreshedMember.roles.cache.has(role.id)).map((role) => role.name);
    if (missingRoleNames.length) throw new Error(`Discord nu a confirmat acordarea rolurilor: ${missingRoleNames.join(', ')}.`);

    const oldRankRoles = [...roles.values(), ...bonusRoles.values()]
      .filter((role) => !retainedRoleIds.has(role.id) && refreshedMember.roles.cache.has(role.id));
    if (oldRankRoles.length) {
      updatedMember = await refreshedMember.roles.remove(oldRankRoles, `Grad actualizat automat la ${rank} după aprobarea HR`);
    } else {
      updatedMember = refreshedMember;
    }

    const desiredNickname = callSign ? `[${callSign}] ${form.name}` : form.name;
    const nickname = Array.from(desiredNickname).slice(0, 32).join('');
    if (updatedMember.nickname !== nickname) await updatedMember.setNickname(nickname, 'Nume setat prin aprobarea cererii HR');
  };
}

async function addMemberToSheets(form, rank) {
  const bounds = RANK_RANGES[rank];
  if (!bounds) throw new Error(`Nu este configurat intervalul pentru gradul ${rank}.`);
  const sheets = await getSheetsApi();
  const spreadsheetId = required('GOOGLE_SPREADSHEET_ID');
  const mainTab = required('GOOGLE_MAIN_SHEET_NAME');
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties(sheetId,title)' });
  const tabs = meta.data.sheets ?? [];
  const mainSheet = tabs.find((sheet) => sheet.properties.title === mainTab);
  if (!mainSheet) throw new Error(`Nu există fila principală „${mainTab}” în foaia Google.`);
  const range = `${quoteTab(mainTab)}!A${bounds[0]}:B${bounds[1]}`;
  const rowResult = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = rowResult.data.values ?? [];
  let targetRow = -1;
  let callSign = '';
  for (let row = bounds[0]; row <= bounds[1]; row += 1) {
    const cells = rows[row - bounds[0]] ?? [];
    if (!String(cells[0] ?? '').trim()) {
      targetRow = row;
      callSign = String(cells[1] ?? '').trim();
      break;
    }
  }
  if (targetRow < 0) throw new Error('Nu s-a găsit un rând gol în zona selectată pentru grad.');

  const sheetDate = bucharestDateSerial();
  const data = [
    { range: `${quoteTab(mainTab)}!A${targetRow}`, values: [[form.memberId]] },
    { range: `${quoteTab(mainTab)}!C${targetRow}`, values: [[form.name]] },
    { range: `${quoteTab(mainTab)}!G${targetRow}`, values: [[form.section]] },
    { range: `${quoteTab(mainTab)}!T${targetRow}`, values: [[form.discordId]] },
    { range: `${quoteTab(mainTab)}!J${targetRow}:K${targetRow}`, values: [[sheetDate, sheetDate]] },
  ];
  if (['Agent-Principal', 'Agent-Sef-Principal'].includes(rank)) {
    data.push({ range: `${quoteTab(mainTab)}!M${targetRow}:N${targetRow}`, values: [[true, true]] });
  }
  const monitor = tabs.find((sheet) => sheet.properties.title === 'MONITORIZARE ACTIVITATE');
  if (monitor) data.push({ range: "'MONITORIZARE ACTIVITATE'!A" + targetRow + ':C' + targetRow, values: [[form.memberId, callSign, form.name]] });
  await sheets.spreadsheets.values.batchUpdate({ spreadsheetId, requestBody: { valueInputOption: 'RAW', data } });
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{
      repeatCell: {
        range: { sheetId: mainSheet.properties.sheetId, startRowIndex: targetRow - 1, endRowIndex: targetRow, startColumnIndex: 9, endColumnIndex: 11 },
          cell: { userEnteredFormat: { numberFormat: { type: 'DATE', pattern: 'dd.MM.yyyy' } } },
        fields: 'userEnteredFormat.numberFormat',
      },
    }] },
  });
  return callSign;
}

function bucharestDateSerial() {
  const dateParts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Bucharest', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const utcMidnight = Date.UTC(Number(dateParts.year), Number(dateParts.month) - 1, Number(dateParts.day));
  return utcMidnight / 86_400_000 + 25_569;
}

async function sendCallsignWebhook(form, callSign, rank) {
  const webhookUrl = required('CALLSIGN_WEBHOOK_URL');
  const url = new URL(webhookUrl);
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length < 4 || parts[0] !== 'api' || parts[1] !== 'webhooks') {
    throw new Error('CALLSIGN_WEBHOOK_URL nu pare să fie un URL Discord webhook valid.');
  }
  const webhook = new WebhookClient({ id: parts[2], token: parts[3] });
  const greeting = form.rehire === 'da' ? 'Bine ai revenit' : 'Bun venit';
  await webhook.send({
    content: `🆕 <@${form.discordId}> - ${greeting} în Poliția **${form.section}**.\nNoul tău callsign este **${callSign}**. Grad: **${rank}**. Nickname-ul tău a fost setat la **[${callSign}] ${form.name}**.`,
    allowedMentions: { users: [form.discordId] },
  });
}

async function removePoliceGradeRoles(guild, discordId, departureType, warnings) {
  if (!guild) {
    warnings.push('Demisia a fost trecută în Sheets, dar serverul Discord nu a fost disponibil pentru retragerea rolurilor.');
    return [];
  }
  const botMember = guild.members.me ?? await guild.members.fetchMe().catch(() => null);
  if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    warnings.push('Botul nu are permisiunea Manage Roles; rolurile de grad Discord nu au fost retrase.');
    return [];
  }
  const member = await guild.members.fetch({ user: discordId, force: true }).catch(() => null);
  if (!member) {
    warnings.push('Utilizatorul nu a fost găsit pe server; rolurile Discord nu au putut fi retrase.');
    return [];
  }

  const settings = [
    ...Object.values(UPDOWN_ROLE_SETTINGS),
    ...UPDOWN_BONUS_ROLES.map((bonus) => bonus.roleSetting),
  ];
  const roleIds = [...new Set([
    ...settings.map((setting) => process.env[setting]?.trim()).filter(Boolean),
    ...AUTO_ADMISSION_EXTRA_ROLE_IDS,
  ])];
  const missingSettings = [...new Set(settings)].filter((setting) => !process.env[setting]?.trim());
  if (missingSettings.length) warnings.push(`Nu sunt configurate toate rolurile de grad pentru retragere: ${missingSettings.join(', ')}.`);
  if (!roleIds.length) {
    warnings.push('Nu sunt configurate roluri de grad în .env; niciun rol Discord nu a fost retras.');
    return [];
  }

  const fetchedRoles = await Promise.all(roleIds.map((id) => guild.roles.fetch(id).catch(() => null)));
  const foundRoles = fetchedRoles.filter(Boolean);
  const missingRoles = roleIds.filter((id, index) => !fetchedRoles[index]);
  if (missingRoles.length) warnings.push(`Nu am putut găsi rolurile Discord cu ID-urile: ${missingRoles.join(', ')}.`);
  const mappedRoleIds = new Set(roleIds);
  const knownGradeNames = new Set([
    ...UPDOWN_RANK_ORDER,
    ...UPDOWN_BONUS_ROLES.map((bonus) => bonus.label),
  ].map(normalizeRoleName));
  const byName = [...member.roles.cache.values()].filter((role) => knownGradeNames.has(normalizeRoleName(role.name)));
  const removableCandidates = [...new Map([
    ...foundRoles.filter((role) => mappedRoleIds.has(role.id) && member.roles.cache.has(role.id)),
    ...byName,
  ].map((role) => [role.id, role])).values()];
  if (!removableCandidates.length) {
    console.warn(`Demisie/OUT ${discordId}: nu am găsit în cont niciun rol de grad din lista configurată sau după nume.`);
    warnings.push('Nu am găsit roluri de grad recunoscute pe contul Discord; verifică dacă rolurile sunt mapate corect în .env.');
    return [];
  }
  const toRemove = removableCandidates;
  const blocked = toRemove.filter((role) => role.managed || botMember.roles.highest.comparePositionTo(role) <= 0);
  if (blocked.length) warnings.push(`Mută rolul botului deasupra acestor roluri ca să le poată retrage: ${blocked.map((role) => role.name).join(', ')}.`);
  const removable = toRemove.filter((role) => !blocked.includes(role));
  if (!removable.length) return [];
  try {
    await member.roles.remove(removable, `Gradurile retrase după ${departureType}`);
  } catch (error) {
    warnings.push(`Datele au fost procesate, dar Discord nu a permis retragerea rolurilor: ${error.message}`);
    return [];
  }
  const refreshed = await guild.members.fetch({ user: discordId, force: true }).catch(() => null);
  const remaining = refreshed
    ? removable.filter((role) => refreshed.roles.cache.has(role.id))
    : removable.filter((role) => member.roles.cache.has(role.id));
  if (remaining.length) {
    warnings.push(`Discord încă arată aceste roluri după retragere: ${remaining.map((role) => role.name).join(', ')}.`);
  }
  const removed = removable.filter((role) => !remaining.some((stillThere) => stillThere.id === role.id));
  console.log(`Roluri de grad retrase pentru ${discordId}: ${removed.map((role) => role.name).join(', ') || 'niciunul'}.`);
  return removed.map((role) => role.name);
}

async function executeDeparture(memberId, departureType, reason, evidenceUrl = '', guild) {
  const sheets = await getSheetsApi();
  const spreadsheetId = required('GOOGLE_SPREADSHEET_ID');
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties(sheetId,title)' });
  const titles = new Set((meta.data.sheets ?? []).map((sheet) => sheet.properties.title));
  const policeTitle = 'MEMBRII POLITIE';
  const monitorTitle = 'MONITORIZARE ACTIVITATE';
  const reintegrationTitle = 'Reintegrare';
  if (!titles.has(policeTitle)) throw new Error(`Nu am găsit fila „${policeTitle}”. Nu s-a modificat nimic.`);
  if (!titles.has(monitorTitle)) throw new Error(`Nu am găsit fila „${monitorTitle}”. Nu s-a modificat nimic.`);
  const ranges = [`${quoteTab(policeTitle)}!A7:T`, `${quoteTab(monitorTitle)}!A:K`];
  const hasReintegrationSheet = titles.has(reintegrationTitle);
  if (hasReintegrationSheet) ranges.push(`${quoteTab(reintegrationTitle)}!A:E`);
  const batch = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: 'FORMATTED_VALUE',
  });
  const policeRows = batch.data.valueRanges?.[0]?.values ?? [];
  const monitorRows = batch.data.valueRanges?.[1]?.values ?? [];
  const reintegrationRows = hasReintegrationSheet ? (batch.data.valueRanges?.[2]?.values ?? []) : [];
  const policeMatches = policeRows.map((row, index) => ({ row, rowNumber: index + 7 }))
    .filter(({ row }) => String(row[0] ?? '').trim() === memberId);
  const policeEntry = policeMatches.find(({ row }) => String(row[2] ?? '').trim() || String(row[19] ?? '').trim())
    ?? policeMatches[0]
    ?? null;
  const monitorMatches = monitorRows.map((row, index) => ({ row, rowNumber: index + 1 }))
    .filter(({ row }) => String(row[0] ?? '').trim() === memberId);
  const monitorEntry = monitorMatches.find(({ row }) => String(row[2] ?? '').trim())
    ?? monitorMatches[0]
    ?? null;
  if (!policeEntry && !monitorEntry) throw new Error(`Nu am găsit ID-ul ${memberId} în „${policeTitle}” sau „${monitorTitle}”. Nu s-a modificat nimic.`);
  if (policeMatches.length > 1) console.warn(`ID ${memberId} apare de mai multe ori în ${policeTitle}; va fi curățat doar rândul activ ${policeEntry.rowNumber}.`);
  if (monitorMatches.length > 1) console.warn(`ID ${memberId} apare de mai multe ori în ${monitorTitle}; va fi curățat doar rândul activ ${monitorEntry.rowNumber}.`);

  const policeRow = policeEntry?.row ?? [];
  const monitorRow = monitorEntry?.row ?? [];
  const id = String(policeRow[0] ?? monitorRow[0] ?? memberId).trim();
  const callsign = String(policeRow[1] ?? '').trim();
  const name = String(policeRow[2] ?? monitorRow[2] ?? '').trim();
  const discordId = String(policeRow[19] ?? '').trim();
  const joinedDate = String(policeRow[9] ?? '').trim();
  const gradeE = String(policeRow[4] ?? '').trim();
  const gradeF = String(policeRow[5] ?? '').trim();
  const numericCallsign = Number(String(callsign).match(/\d+/)?.[0] ?? Number.NaN);
  const isReintegrationEligible = Number.isFinite(numericCallsign) && numericCallsign < 399;
  const rowGrade = policeEntry
    ? Object.entries(POLICE_GRADE_ROW_RANGES).find(([, [first, last]]) => policeEntry.rowNumber >= first && policeEntry.rowNumber <= last)?.[0] ?? ''
    : '';
  const carriedGrade = [gradeE, gradeF].filter(Boolean).join(' ').trim();
  const reintegrationGrade = rowGrade || carriedGrade;

  const data = [];
  if (policeEntry) {
    const policeTab = quoteTab(policeTitle);
    for (const column of ['A', 'C', 'D', 'E', 'F', 'G', 'J', 'K', 'L', 'T']) {
      data.push({ range: `${policeTab}!${column}${policeEntry.rowNumber}`, values: [['']] });
    }
    data.push({ range: `${policeTab}!M${policeEntry.rowNumber}:Q${policeEntry.rowNumber}`, values: [[false, false, false, false, false]] });
  }
  if (monitorEntry) {
    const monitorTab = quoteTab(monitorTitle);
    for (const column of ['A', 'C', 'E', 'F', 'G', 'H', 'I', 'J', 'K']) {
      data.push({ range: `${monitorTab}!${column}${monitorEntry.rowNumber}`, values: [['']] });
    }
  }
  if (policeEntry && hasReintegrationSheet && isReintegrationEligible) {
    const lastUsedIndex = reintegrationRows.reduce((last, row, index) =>
      row.some((value) => String(value ?? '').trim()) ? index : last, -1);
    const appendRow = lastUsedIndex + 2;
    data.push({
      range: `${quoteTab(reintegrationTitle)}!A${appendRow}:E${appendRow}`,
      values: [[id, discordId, departureDateString(), reintegrationGrade, '']],
    });
  }
  if (!data.length) throw new Error('Nu am găsit date care să poată fi procesate.');
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: 'RAW', data },
  });

  const warnings = [];
  let removedDiscordRoles = [];
  if (discordId && /^\d{15,25}$/.test(discordId)) {
    removedDiscordRoles = await removePoliceGradeRoles(guild, discordId, departureType, warnings);
  } else {
    warnings.push('Discord ID-ul din coloana T lipsește sau nu este valid; rolurile Discord nu au putut fi retrase.');
  }
  const actionText = departureType === 'out'
    ? 'a fost scos din Departamentul de Poliție prin OUT'
    : 'i-a fost acceptată demisia din Departamentul de Poliție';
  const reasonText = reason ? `Motiv: ${reason}${evidenceUrl ? ` • Filmare: ${evidenceUrl}` : ''}` : '';
  if (discordId && /^\d{15,25}$/.test(discordId)) {
    const elapsedDays = daysSinceSheetDate(joinedDate);
    if (elapsedDays !== null) {
      const policyRoleId = process.env.DEPARTURE_HR_ROLE_ID?.trim()
        || process.env.DISCORD_INSTRUCTOR_HR_ROLE_ID?.trim();
      if (elapsedDays >= 14) {
        const content = `‼️ <@${discordId}> **${name}** ${actionText}. ID in-game: **${id}**.${reasonText ? `\n${reasonText}` : ''}`;
        await sendDepartureWebhook('DEPARTURE_POLICY_WEBHOOK_URL', content, { users: [discordId] }, warnings);
      } else {
        const remainingDays = 14 - elapsedDays;
        const mention = policyRoleId ? `<@&${policyRoleId}> <@&${policyRoleId}> ` : '';
        const content = `‼️ ${mention}**${name} ${id} ${remainingDays} ${remainingDays === 1 ? 'zi' : 'zile'} EȘECUL DE A STA MINIM 14 ZILE ÎNTR-O FACȚIUNE LEGALĂ**.${reasonText ? `\n${reasonText}` : ''}`;
        await sendDepartureWebhook('DEPARTURE_POLICY_WEBHOOK_URL', content,
          { users: [], roles: policyRoleId ? [policyRoleId] : [] }, warnings);
        if (!policyRoleId) warnings.push('Setează DEPARTURE_HR_ROLE_ID ca webhook-ul de regulă 14 zile să poată menționa HR.');
      }
    } else {
      warnings.push('Nu am putut citi o dată validă din coloana J; notificarea pentru regula de 14 zile a fost omisă.');
    }
if (departureType === 'demisie') {
  await sendDepartureWebhook(
    'DEPARTURE_WEBHOOK_URL',
    `‼️ <@${discordId}> ${actionText}.`,
    { users: [discordId] },
    warnings,
  );
  } else {
  warnings.push('Membrul nu are un Discord ID valid în coloana T; notificările Discord au fost omise.');
}
}

  const grade = [gradeE, gradeF].filter(Boolean).join(' ').trim() || 'Necompletat';
  const details = [
    { name: 'Membru', value: name || 'Nume negăsit', inline: true },
    { name: 'Callsign', value: callsign || 'Necompletat', inline: true },
    { name: 'Grad la ieșire', value: reintegrationGrade || grade, inline: true },
    { name: 'Roluri Discord retrase', value: removedDiscordRoles.join(', ') || 'Niciunul; verifică avertismentele de mai jos.', inline: false },
    ...(reason ? [{ name: 'Motiv', value: reason, inline: false }] : []),
    ...(evidenceUrl ? [{ name: 'Filmare cu motivul OUT', value: evidenceUrl, inline: false }] : []),
    { name: 'Reintegrare', value: policeEntry && hasReintegrationSheet && isReintegrationEligible
      ? `Adăugată în fila Reintegrare${reintegrationGrade ? ` cu gradul ${reintegrationGrade}` : ' (gradul nu a putut fi determinat)'}`
      : 'Nu s-a adăugat (callsign ≥ 399 sau lipsește fila)', inline: false },
  ];
  return { details, warnings, removedDiscordRoles };
}

function departureDateString() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Bucharest', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${parts.day}-${parts.month}-${parts.year}`;
}

function daysSinceSheetDate(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  let year; let month; let day;
  const dmy = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  const ymd = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (dmy) [, day, month, year] = dmy;
  else if (ymd) [, year, month, day] = ymd;
  else return null;
  const joined = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const todayParts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Bucharest', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const today = Date.UTC(Number(todayParts.year), Number(todayParts.month) - 1, Number(todayParts.day));
  return Math.floor((today - joined) / 86_400_000);
}

async function sendDepartureWebhook(setting, content, allowedMentions, warnings) {
  const webhookUrl = process.env[setting]?.trim();
  if (!webhookUrl) {
    warnings.push(`Lipsește ${setting}; mesajul asociat nu a fost trimis.`);
    return;
  }
  try {
    const url = new URL(webhookUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 4 || parts[0] !== 'api' || parts[1] !== 'webhooks') {
      throw new Error('URL-ul nu pare să fie un webhook Discord valid.');
    }
    const webhook = new WebhookClient({ id: parts[2], token: parts[3] });
    await webhook.send({ content, allowedMentions: { parse: [], ...allowedMentions } });
    webhook.destroy();
  } catch (error) {
    console.error(`Webhook-ul ${setting} nu a putut trimite mesajul:`, error);
    warnings.push(`${setting}: ${error.message}`);
  }
}

async function registerCommands() {
  const token = required('DISCORD_BOT_TOKEN');
  const clientId = required('DISCORD_CLIENT_ID');
  const guildId = required('DISCORD_GUILD_ID');
  const panelCommand = new SlashCommandBuilder().setName('panel').setDescription('Publică panelul de înscriere a membrilor');
  const departurePanelCommand = new SlashCommandBuilder().setName('panel-out').setDescription('Publică panelul de demisii și OUT');
  const leavePanelCommand = new SlashCommandBuilder().setName('panel-concediu').setDescription('Publică panelul pentru cereri de concediu');
  const cooldownPanelCommand = new SlashCommandBuilder().setName('panel-cooldown').setDescription('Publică panelul pentru gestionarea cooldown-urilor');
  const instructorPanelCommand = new SlashCommandBuilder().setName('panel-instructor').setDescription('Publică panelul de adăugare a instructorilor');
  const upDownPanelCommand = new SlashCommandBuilder().setName('panel-updown').setDescription('Publică panelul pentru UP / DOWN');
  await new REST({ version: '10' }).setToken(token)
    .put(Routes.applicationGuildCommands(clientId, guildId), { body: [panelCommand.toJSON(), departurePanelCommand.toJSON(), leavePanelCommand.toJSON(), cooldownPanelCommand.toJSON(), instructorPanelCommand.toJSON(), upDownPanelCommand.toJSON()] });
  console.log(`Comenzile /panel, /panel-out, /panel-concediu, /panel-cooldown, /panel-instructor și /panel-updown au fost înregistrate pentru serverul ${guildId}`);
}

function instructorCommandOptions(subcommand, name, description) {
  return subcommand.setName(name).setDescription(description)
    .addStringOption((option) => option.setName('id').setDescription('ID-ul membrului din foaia principală')
      .setRequired(true).setMinLength(1).setMaxLength(24))
    .addStringOption((option) => option.setName('certificat').setDescription('Certificatul de INSTRUCTOR vizat')
      .setRequired(true).addChoices(
        { name: 'INSTRUCTOR RADIO', value: 'radio' },
        { name: 'INSTRUCTOR MDT', value: 'mdt' },
        { name: 'Tester PD', value: 'tester_pd' },
        { name: 'Human Resources', value: 'hr' },
        { name: 'INSTRUCTOR MOTO', value: 'moto' },
        { name: 'INSTRUCTOR PILOT', value: 'heli' },
        { name: 'INSTRUCTOR HS', value: 'hs' },
      ));
}

function sanctionCommandOptions(subcommand, name, description) {
  return subcommand.setName(name).setDescription(description)
    .addStringOption((option) => option.setName('id').setDescription('ID-ul din coloana A a filei MEMBRII POLITIE')
      .setRequired(true).setMinLength(1).setMaxLength(24))
    .addStringOption((option) => option.setName('certificat').setDescription('Certificatul vizat')
      .setRequired(true).addChoices(
        { name: 'Radio', value: 'radio' },
        { name: 'MDT', value: 'mdt' },
        { name: 'MOTO', value: 'moto' },
        { name: 'PILOT', value: 'pilot' },
        { name: 'HS', value: 'hs' },
      ));
}

async function main() {
  await registerCommands();
  await client.login(required('DISCORD_BOT_TOKEN'));
}

main().catch((error) => {
  console.error('Botul nu a putut porni:', error.message);
  process.exitCode = 1;
});
