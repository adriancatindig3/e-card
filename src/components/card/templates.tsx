import type { ComponentType } from 'react';
import { linkItems, type CardModel } from '../../lib/card';
import { validateEmail, validatePhone } from '../../lib/platforms';
import { PlatformIcon } from '../Icons';
import { CardLinks } from './CardLinks';
import { Avatar, Cover } from './Media';

interface Props {
  card: CardModel;
}

function FrameImage({ card }: Props) {
  if (card.coverPhoto) return <Cover src={card.coverPhoto} className="frame-photo" />;
  return <Avatar src={card.profilePhoto} name={card.displayName} className="frame-photo" />;
}

function SplitCover({ card }: Props) {
  return (
    <article className="tpl tpl-01">
      <Cover src={card.coverPhoto} />
      <div className="body">
        <Avatar src={card.profilePhoto} name={card.displayName} className="overlap" />
        <h1>{card.displayName}</h1>
        {card.headline ? <p className="headline">{card.headline}</p> : null}
        {card.company ? <p className="company">{card.company}</p> : null}
        {card.location ? <p className="location">{card.location}</p> : null}
        {card.bio ? <p className="bio">{card.bio}</p> : null}
        <CardLinks card={card} variant="icons" />
      </div>
    </article>
  );
}

function Pin() {
  return (
    <svg className="pin" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.8a6.2 6.2 0 0 0-6.2 6.2c0 4.5 6.2 12.2 6.2 12.2s6.2-7.7 6.2-12.2A6.2 6.2 0 0 0 12 2.8zm0 8.4a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4z"
      />
    </svg>
  );
}

function Studio({ card, tone }: { card: CardModel; tone: 'paper' | 'forest' | 'navy' }) {
  const phone = validatePhone(card.phone);
  const email = validateEmail(card.contactEmail);
  const contacts = [phone, email].filter((item) => item.ok && !item.empty).length;
  const links = linkItems(card).filter((item) => item.id !== 'phone' && item.id !== 'email').length;
  return (
    <article className={`tpl studio tone-${tone}`}>
      <header className="studio-id">
        <Avatar src={card.profilePhoto} name={card.displayName} />
        <div>
          <h1>{card.displayName}</h1>
          {card.headline ? <p className="headline">{card.headline}</p> : null}
          {card.company ? (
            <p className="company">
              <Pin />
              {card.company}
            </p>
          ) : null}
        </div>
      </header>
      <div className="studio-rule" />
      {card.bio ? <p className="bio">{card.bio}</p> : null}
      <div className="studio-stats">
        <p>
          <strong>{contacts}</strong>
          <span>Contact</span>
        </p>
        <p>
          <strong>{links}</strong>
          <span>Links</span>
        </p>
      </div>
      {contacts > 0 ? (
        <section className="studio-contact">
          <h2>Contact</h2>
          {email.ok && !email.empty ? (
            <a href={email.href}>
              <PlatformIcon id="email" />
              <span>{card.contactEmail.trim()}</span>
            </a>
          ) : null}
          {phone.ok && !phone.empty ? (
            <a href={phone.tel}>
              <PlatformIcon id="phone" />
              <span>{card.phone.trim()}</span>
            </a>
          ) : null}
        </section>
      ) : null}
      <CardLinks card={card} variant="icons" omit={['phone', 'email']} />
    </article>
  );
}

function Centered({ card }: Props) {
  return <Studio card={card} tone="paper" />;
}

function Dark({ card }: Props) {
  return <Studio card={card} tone="forest" />;
}

function SideRail({ card }: Props) {
  return (
    <article className="tpl tpl-04">
      <aside>
        <Avatar src={card.profilePhoto} name={card.displayName} />
      </aside>
      <div className="main">
        <h1>{card.displayName}</h1>
        {card.headline ? <p className="headline">{card.headline}</p> : null}
        {card.company ? <p className="company">{card.company}</p> : null}
        {card.location ? <p className="location">{card.location}</p> : null}
        {card.bio ? <p className="bio">{card.bio}</p> : null}
        <CardLinks card={card} variant="rows" />
      </div>
    </article>
  );
}

function Editorial({ card }: Props) {
  return (
    <article className="tpl tpl-05">
      <p className="kicker">Profile</p>
      <div className="title-row">
        <h1>{card.displayName}</h1>
        <Avatar src={card.profilePhoto} name={card.displayName} />
      </div>
      {card.headline ? <p className="headline">{card.headline}</p> : null}
      {card.bio ? <p className="bio lede">{card.bio}</p> : null}
      <div className="meta-line">
        {card.company ? <span>{card.company}</span> : null}
        {card.location ? <span>{card.location}</span> : null}
      </div>
      {card.coverPhoto ? <Cover src={card.coverPhoto} className="wide" /> : null}
      <CardLinks card={card} variant="rows" />
    </article>
  );
}

function Inset({ card }: Props) {
  return (
    <div className="tpl tpl-06">
      <article>
        <Cover src={card.coverPhoto} />
        <Avatar src={card.profilePhoto} name={card.displayName} />
        <h1>{card.displayName}</h1>
        {card.headline ? <p className="headline">{card.headline}</p> : null}
        {card.company ? <p className="company">{card.company}</p> : null}
        {card.location ? <p className="location">{card.location}</p> : null}
        {card.bio ? <p className="bio">{card.bio}</p> : null}
        <CardLinks card={card} variant="icons" />
      </article>
    </div>
  );
}

function Identity({ card }: Props) {
  return (
    <article className="tpl tpl-07">
      <header>
        <Avatar src={card.profilePhoto} name={card.displayName} />
        <div>
          <h1>{card.displayName}</h1>
          {card.headline ? <p className="headline">{card.headline}</p> : null}
        </div>
      </header>
      <dl>
        {card.company ? (
          <div>
            <dt>Company</dt>
            <dd>{card.company}</dd>
          </div>
        ) : null}
        {card.location ? (
          <div>
            <dt>Location</dt>
            <dd>{card.location}</dd>
          </div>
        ) : null}
        {card.bio ? (
          <div>
            <dt>About</dt>
            <dd>{card.bio}</dd>
          </div>
        ) : null}
      </dl>
      <CardLinks card={card} variant="rows" />
    </article>
  );
}

function Sheet({ card }: Props) {
  return (
    <div className="tpl tpl-08">
      <article>
        <Cover src={card.coverPhoto} />
        <div className="pad">
          <Avatar src={card.profilePhoto} name={card.displayName} />
          <h1>{card.displayName}</h1>
          {card.headline ? <p className="headline">{card.headline}</p> : null}
          {card.company ? <p className="company">{card.company}</p> : null}
          {card.location ? <p className="location">{card.location}</p> : null}
          {card.bio ? <p className="bio">{card.bio}</p> : null}
          <CardLinks card={card} variant="icons" />
        </div>
      </article>
    </div>
  );
}

function Portrait({ card }: Props) {
  return (
    <article className="tpl tpl-09">
      <Avatar src={card.profilePhoto} name={card.displayName} className="xl" />
      <h1>{card.displayName}</h1>
      {card.headline ? <p className="headline">{card.headline}</p> : null}
      {card.company ? <p className="company">{card.company}</p> : null}
      {card.location ? <p className="location">{card.location}</p> : null}
      {card.bio ? <p className="bio">{card.bio}</p> : null}
      <CardLinks card={card} variant="icons" />
    </article>
  );
}

function Formal({ card }: Props) {
  return <Studio card={card} tone="navy" />;
}

function Grouped({ card }: Props) {
  return (
    <article className="tpl tpl-11">
      <header>
        <Avatar src={card.profilePhoto} name={card.displayName} />
        <h1>{card.displayName}</h1>
        {card.headline ? <p className="headline">{card.headline}</p> : null}
      </header>
      {card.bio || card.company || card.location ? (
        <section>
          <h2>About</h2>
          <div className="group">
            {card.bio ? <p>{card.bio}</p> : null}
            {card.company ? <p>{card.company}</p> : null}
            {card.location ? <p className="location">{card.location}</p> : null}
          </div>
        </section>
      ) : null}
      <section>
        <h2>Links</h2>
        <CardLinks card={card} variant="rows" />
      </section>
    </article>
  );
}

function TypeFirst({ card }: Props) {
  return (
    <article className="tpl tpl-12">
      <h1>{card.displayName}</h1>
      {card.headline ? <p className="headline">{card.headline}</p> : null}
      <Cover src={card.coverPhoto} />
      <div className="pad">
        {card.company ? <p className="company">{card.company}</p> : null}
        {card.location ? <p className="location">{card.location}</p> : null}
        {card.bio ? <p className="bio">{card.bio}</p> : null}
        <CardLinks card={card} variant="rows" />
      </div>
    </article>
  );
}

function FullBleed({ card }: Props) {
  return (
    <article className="tpl tpl-13">
      <div className="bleed">
        <Cover src={card.coverPhoto || card.profilePhoto} />
      </div>
      <div className="panel">
        <Avatar src={card.profilePhoto} name={card.displayName} className="overlap" />
        <h1>{card.displayName}</h1>
        {card.headline ? <p className="headline">{card.headline}</p> : null}
        {card.company ? <p className="company">{card.company}</p> : null}
        {card.location ? <p className="location">{card.location}</p> : null}
        {card.bio ? <p className="bio">{card.bio}</p> : null}
        <CardLinks card={card} variant="icons" />
      </div>
    </article>
  );
}

function Ticket({ card }: Props) {
  return (
    <article className="tpl tpl-14">
      <header>
        <p className="kicker">Digital Card</p>
        <h1>{card.displayName}</h1>
        {card.headline ? <p className="headline">{card.headline}</p> : null}
      </header>
      <div className="perforation" />
      <div className="stub">
        <Avatar src={card.profilePhoto} name={card.displayName} />
        {card.company ? <p className="company">{card.company}</p> : null}
        {card.location ? <p className="location">{card.location}</p> : null}
        {card.bio ? <p className="bio">{card.bio}</p> : null}
        <CardLinks card={card} variant="rows" />
      </div>
    </article>
  );
}

function Namecard({ card }: Props) {
  const phone = validatePhone(card.phone);
  const email = validateEmail(card.contactEmail);
  return (
    <article className="tpl tpl-15">
      <header>
        <Avatar src={card.profilePhoto} name={card.displayName} />
        <div>
          <h1>{card.displayName}</h1>
          {card.headline ? <p className="headline">{card.headline}</p> : null}
        </div>
      </header>
      <div className="grid">
        {card.company ? (
          <p>
            <span>Company</span>
            {card.company}
          </p>
        ) : null}
        {card.location ? (
          <p>
            <span>Location</span>
            {card.location}
          </p>
        ) : null}
        {phone.ok && !phone.empty ? (
          <p>
            <span>Phone</span>
            <a href={phone.tel}>{card.phone.trim()}</a>
          </p>
        ) : null}
        {email.ok && !email.empty ? (
          <p>
            <span>Email</span>
            <a href={email.href}>{card.contactEmail.trim()}</a>
          </p>
        ) : null}
      </div>
      {card.bio ? <p className="bio">{card.bio}</p> : null}
      <CardLinks card={card} variant="icons" omit={['phone', 'email']} />
    </article>
  );
}

function Spacious({ card }: Props) {
  return (
    <article className="tpl tpl-16">
      <Avatar src={card.profilePhoto} name={card.displayName} />
      <h1>{card.displayName}</h1>
      {card.headline ? <p className="headline">{card.headline}</p> : null}
      <div className="rule" />
      {card.company ? <p className="company">{card.company}</p> : null}
      {card.location ? <p className="location">{card.location}</p> : null}
      {card.bio ? <p className="bio">{card.bio}</p> : null}
      <div className="rule" />
      <CardLinks card={card} variant="icons" />
    </article>
  );
}

function Grid({ card }: Props) {
  return (
    <article className="tpl tpl-17">
      <div className="cell name">
        <h1>{card.displayName}</h1>
        {card.headline ? <p className="headline">{card.headline}</p> : null}
      </div>
      <Cover src={card.coverPhoto} className="span" />
      {card.company ? (
        <div className="cell">
          <span>Company</span>
          <p>{card.company}</p>
        </div>
      ) : null}
      {card.location ? (
        <div className="cell">
          <span>Location</span>
          <p>{card.location}</p>
        </div>
      ) : null}
      {card.bio ? (
        <div className="cell span">
          <span>About</span>
          <p>{card.bio}</p>
        </div>
      ) : null}
      <div className="cell span links">
        <CardLinks card={card} variant="rows" />
      </div>
    </article>
  );
}

function Banner({ card }: Props) {
  return (
    <article className="tpl tpl-18">
      <Cover src={card.coverPhoto} className="banner" />
      <div className="pad">
        <div className="inline">
          <Avatar src={card.profilePhoto} name={card.displayName} />
          <div>
            <h1>{card.displayName}</h1>
            {card.headline ? <p className="headline">{card.headline}</p> : null}
          </div>
        </div>
        {card.company ? <p className="company">{card.company}</p> : null}
        {card.location ? <p className="location">{card.location}</p> : null}
        {card.bio ? <p className="bio">{card.bio}</p> : null}
        <CardLinks card={card} variant="rows" />
      </div>
    </article>
  );
}

function Frame({ card }: Props) {
  return (
    <article className="tpl tpl-19">
      <figure>
        <FrameImage card={card} />
        <figcaption>
          <h1>{card.displayName}</h1>
          {card.headline ? <p className="headline">{card.headline}</p> : null}
        </figcaption>
      </figure>
      <div className="pad">
        {card.company ? <p className="company">{card.company}</p> : null}
        {card.location ? <p className="location">{card.location}</p> : null}
        {card.bio ? <p className="bio">{card.bio}</p> : null}
        <CardLinks card={card} variant="rows" />
      </div>
    </article>
  );
}

function LinkSheet({ card }: Props) {
  return (
    <article className="tpl tpl-20">
      <header>
        <Avatar src={card.profilePhoto} name={card.displayName} />
        <div>
          <h1>{card.displayName}</h1>
          {card.headline ? <p className="headline">{card.headline}</p> : null}
          {card.company ? <p className="company">{card.company}</p> : null}
        </div>
      </header>
      {card.location ? <p className="location">{card.location}</p> : null}
      {card.bio ? <p className="bio">{card.bio}</p> : null}
      <CardLinks card={card} variant="sheet" />
    </article>
  );
}

export const TEMPLATES: { id: string; name: string; Component: ComponentType<Props> }[] = [
  { id: 'card-01', name: 'Split cover', Component: SplitCover },
  { id: 'card-02', name: 'Paper', Component: Centered },
  { id: 'card-03', name: 'Forest', Component: Dark },
  { id: 'card-04', name: 'Side rail', Component: SideRail },
  { id: 'card-05', name: 'Editorial', Component: Editorial },
  { id: 'card-06', name: 'Inset', Component: Inset },
  { id: 'card-07', name: 'Identity', Component: Identity },
  { id: 'card-08', name: 'Sheet', Component: Sheet },
  { id: 'card-09', name: 'Portrait', Component: Portrait },
  { id: 'card-10', name: 'Navy', Component: Formal },
  { id: 'card-11', name: 'Grouped', Component: Grouped },
  { id: 'card-12', name: 'Type first', Component: TypeFirst },
  { id: 'card-13', name: 'Full bleed', Component: FullBleed },
  { id: 'card-14', name: 'Ticket', Component: Ticket },
  { id: 'card-15', name: 'Namecard', Component: Namecard },
  { id: 'card-16', name: 'Spacious', Component: Spacious },
  { id: 'card-17', name: 'Grid', Component: Grid },
  { id: 'card-18', name: 'Banner', Component: Banner },
  { id: 'card-19', name: 'Frame', Component: Frame },
  { id: 'card-20', name: 'Link sheet', Component: LinkSheet },
];

export function templateName(id: string): string {
  return TEMPLATES.find((item) => item.id === id)?.name ?? 'Split cover';
}

export function CardView({
  card,
  templateId,
  mode,
}: {
  card: CardModel;
  templateId: string;
  mode: 'screen' | 'preview';
}) {
  const entry = TEMPLATES.find((item) => item.id === templateId) ?? TEMPLATES[0];
  const Template = entry.Component;
  return (
    <div className={mode === 'screen' ? 'tpl-screen' : 'tpl-preview'}>
      <Template card={card} />
    </div>
  );
}
