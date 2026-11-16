import Link from "next/link";
import { ArrowLeft, CheckCheck, ChevronDown, CircleAlert, Clock3, Inbox, Mail, MailCheck, MessageCircle, Trash2 } from "lucide-react";
import { deleteMessageAction, markMessageReadAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { AdminCopyEmailButton } from "@/components/admin-copy-email-button";
import { AdminMessageReplyForm } from "@/components/admin-message-reply-form";
import { AdminGmailSettingsForm } from "@/components/admin-gmail-settings-form";
import {
  AdminMessageSelectCheckbox,
  AdminMessageSelection,
  AdminMessageSelectionToolbar,
} from "@/components/admin-message-selection";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminPath } from "@/lib/admin-paths";
import { getGmailConfigurationStatus } from "@/lib/gmail";

export const instant = false;

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await requireAdmin();
  const { filter } = await searchParams;
  const onlyUnread = filter === "unread";
  const [messages, totalMessages, unreadMessages, gmailConfiguration] = await Promise.all([
    prisma.message.findMany({
      where: onlyUnread ? { readAt: null } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { name: true } } },
        },
      },
    }),
    prisma.message.count(),
    prisma.message.count({ where: { readAt: null } }),
    getGmailConfigurationStatus(),
  ]);
  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <AdminShell user={session}>
      <div className="admin-page-heading">
        <div><Link className="admin-back" href={getAdminPath("/admin", session.role)}><ArrowLeft size={14} /> Tableau de bord</Link><span className="section-kicker"><Inbox size={15} /> MESSAGES ENTRANTS</span><h1>Messages</h1><p>Les demandes envoyées depuis le formulaire public.</p></div>
        <span className="admin-count">{unreadMessages} non lu{unreadMessages === 1 ? "" : "s"}</span>
      </div>
      <nav className="admin-filter-tabs" aria-label="Filtrer les messages">
        <Link className={onlyUnread ? undefined : "is-active"} aria-current={onlyUnread ? undefined : "page"} href={getAdminPath("/admin/messages", session.role)}>Tous <span>{totalMessages}</span></Link>
        <Link className={onlyUnread ? "is-active" : undefined} aria-current={onlyUnread ? "page" : undefined} href={getAdminPath("/admin/messages?filter=unread", session.role)}>Non lus <span>{unreadMessages}</span></Link>
      </nav>
      <AdminGmailSettingsForm
        configured={gmailConfiguration.configured}
        account={gmailConfiguration.account}
        allowedFrom={gmailConfiguration.allowedFrom}
      />
      <AdminMessageSelection messageIds={messages.map((message) => message.id)}>
        <section className="admin-panel messages-panel">
          <div className="admin-panel-heading">
            <div><h2><Inbox size={20} aria-hidden="true" /> Boîte de réception</h2><p className="messages-panel-hint">Les plus récents en premier. Ouvrez un échange pour le lire et y répondre.</p></div>
            <span className="message-total">{messages.length} message{messages.length === 1 ? "" : "s"}</span>
          </div>
          <div className="messages-panel-tools"><AdminMessageSelectionToolbar /></div>
          <div className="messages-list">
          {messages.length ? messages.map((message) => (
            <article className={`message-card${message.readAt ? " is-read" : ""}`} key={message.id} aria-labelledby={`message-subject-${message.id}`}>
              <header className="message-card-heading">
                <AdminMessageSelectCheckbox messageId={message.id} messageName={message.name} />
                <span className="message-icon" aria-hidden="true">{message.readAt ? <MailCheck size={19} /> : <Mail size={19} />}</span>
                <div className="message-identity">
                  <div className="message-overview">
                    <span className={`message-read-status ${message.readAt ? "is-read" : "is-unread"}`}>{message.readAt ? "Lu" : "Non lu"}</span>
                    <time dateTime={message.createdAt.toISOString()}>Reçu le {dateFormatter.format(message.createdAt)}</time>
                  </div>
                  <h3 id={`message-subject-${message.id}`}>{message.subject}</h3>
                  <div className="message-contact-line">
                    <strong>{message.name}</strong>
                    <span className="message-email"><a href={`mailto:${message.email}`}>{message.email}</a><AdminCopyEmailButton email={message.email} /></span>
                  </div>
                </div>
              </header>
              <details className="message-thread" open={!message.readAt}>
                <summary>
                  <span className="message-thread-heading">
                    <span className="message-thread-label"><MessageCircle size={15} aria-hidden="true" /><span className="message-thread-closed-label">Voir les échanges</span><span className="message-thread-open-label">Masquer les échanges</span></span>
                    <span className="message-reply-count">{message.replies.length} réponse{message.replies.length === 1 ? "" : "s"}</span>
                    <ChevronDown className="message-thread-chevron" size={17} aria-hidden="true" />
                  </span>
                  <span className="message-thread-preview">{message.message}</span>
                </summary>
                <ol className="message-conversation" aria-label="Historique des échanges, du plus ancien au plus récent">
                  <li className="message-conversation-entry message-conversation-incoming">
                    <div className="message-conversation-meta">
                      <span className="message-entry-kind"><Mail size={14} aria-hidden="true" /> Message reçu</span>
                      <time dateTime={message.createdAt.toISOString()}>{dateFormatter.format(message.createdAt)}</time>
                    </div>
                    <strong className="message-entry-author">{message.name}</strong>
                    <p>{message.message}</p>
                  </li>
                  {message.replies.map((reply) => (
                    <li className={`message-conversation-entry message-conversation-outgoing is-${reply.status.toLowerCase()}`} key={reply.id}>
                      <div className="message-conversation-meta">
                        <span className="message-entry-kind">
                          {reply.status === "SENT" ? <CheckCheck size={14} aria-hidden="true" /> : reply.status === "FAILED" ? <CircleAlert size={14} aria-hidden="true" /> : <Clock3 size={14} aria-hidden="true" />}
                          {reply.status === "SENT" ? "Réponse envoyée" : reply.status === "FAILED" ? "Échec de l’envoi" : "Envoi en cours"}
                        </span>
                        <time dateTime={reply.createdAt.toISOString()}>{dateFormatter.format(reply.createdAt)}</time>
                      </div>
                      <strong className="message-entry-author">{reply.senderName} <span>· Équipe</span></strong>
                      <a className="message-entry-email" href={`mailto:${reply.senderEmail}`}>{reply.senderEmail}</a>
                      <small className="message-entry-subject">Objet : {reply.subject}</small>
                      <p>{reply.body}</p>
                    </li>
                  ))}
                </ol>
                <details className="message-reply">
                  <summary><MessageCircle size={16} aria-hidden="true" /><span>Rédiger une réponse</span><ChevronDown size={16} aria-hidden="true" /></summary>
                  <AdminMessageReplyForm
                    messageId={message.id}
                    recipientName={message.name}
                    recipientEmail={message.email}
                    subject={message.subject}
                    defaultSenderName={session.name}
                    defaultSenderEmail={session.email}
                  />
                </details>
              </details>
              <footer className="message-card-actions">
                {message.readAt ? <span className="message-read-note"><MailCheck size={15} aria-hidden="true" /> Message lu</span> : (
                  <form action={markMessageReadAction}>
                    <input type="hidden" name="id" value={message.id} />
                    <button className="message-mark-read" type="submit"><MailCheck size={15} aria-hidden="true" /> Marquer comme lu</button>
                  </form>
                )}
                <form action={deleteMessageAction}>
                  <input type="hidden" name="id" value={message.id} />
                  <ConfirmDeleteButton
                    className="message-delete"
                    aria-label={`Supprimer le message de ${message.name}`}
                    title="Supprimer ce message"
                    confirmationMessage={`Voulez-vous vraiment supprimer le message « ${message.subject} » de ${message.name} ainsi que tout son historique de réponses ?`}
                  >
                    <Trash2 size={14} aria-hidden="true" /> Supprimer
                  </ConfirmDeleteButton>
                </form>
              </footer>
            </article>
          )) : <div className="admin-empty"><Inbox size={28} aria-hidden="true" /><strong>{onlyUnread ? "Tous les messages ont été lus." : "Votre boîte de réception est vide."}</strong><p>{onlyUnread ? "Aucun message non lu pour le moment." : "Les demandes envoyées via le formulaire de contact apparaîtront ici."}</p></div>}
          </div>
        </section>
      </AdminMessageSelection>
    </AdminShell>
  );
}
