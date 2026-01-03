# David Ordaz Jr. - Case Notes

## Source Data

Originally from Mapping Police Violence CSV dataset.

### CSV Record
```json
{
  "name": "David Ordaz, Jr.",
  "age": "34",
  "gender": "Male",
  "race": "Hispanic",
  "date": "3/14/2021",
  "street_address": "100 North Rowan Avenue",
  "city": "Los Angeles",
  "state": "California",
  "zip": "90063",
  "county": "Los Angeles",
  "agency_responsible": "Los Angeles County Sheriff's Department",
  "ori": "CA0190000",
  "cause_of_death": "Gunshot",
  "disposition_official": "Charged with a crime,Civil suit/Pending,Plead no contest,Probation",
  "officer_charged": "Charged with assault"
}
```

## Research Sources

### Primary Sources
- [NBC Los Angeles - Body Camera Video Released](https://www.nbclosangeles.com/news/local/body-camera-video-released-of-man-shot-and-killed-by-lasd-deputies-in-east-la/2656931/)
- [LAist - DA Charges Deputy](https://laist.com/news/criminal-justice/da-charges-la-sheriffs-deputy-with-assault-in-fatal-shooting-of-man-having-a-mental-health-crisis)
- [LAist - Family Called for Help](https://laist.com/news/criminal-justice/the-family-of-david-ordaz-jr-called-police-for-help-instead-he-ended-up-dead-on-a-sidewalk)
- [LAist - Federal Lawsuit Filed](https://laist.com/news/criminal-justice/david-ordaz-jr-was-fatally-shot-by-sheriffs-deputies-in-front-of-his-family-now-theyre-filing-a-federal-lawsuit)
- [ABC7 - Deputy Pleads No Contest](https://abc7.com/post/sheriffs-deputy-pleads-contest-avoids-jail-fatal-shooting-east-la-man-david-ordaz-jr/15564323/)
- [CBS Los Angeles - Deputy Charged](https://www.cbsnews.com/losangeles/news/lasd-deputy-charged-for-fatally-shooting-man-during-mental-health-crisis-in-2021/)
- [CNN - Sheriff's Grave Concerns](https://www.cnn.com/2021/07/31/us/david-ordaz-los-angeles-county-sheriff-concerns-deputy/index.html)
- [NBC News - Sheriff's Statement](https://www.nbcnews.com/news/us-news/l-sheriff-has-grave-concerns-over-death-man-fatally-shot-n1275615)

### Key Details

**Officer Involved:**
- Deputy Remin Pineda, 38 at time of incident (40 at sentencing)
- Three other deputies also present but not charged

**Timeline:**
- March 14, 2021: Shooting incident
- July 29, 2021: Family press conference
- July 30, 2021: Federal lawsuit filed
- July 31, 2021: Body camera footage released, Sheriff Villanueva expresses "grave concerns"
- November 10, 2022: DA Gascón announces charges against Pineda
- November 2024: Pineda pleads no contest, sentenced to probation

**Family Members:**
- David Ordaz Sr. (father)
- Hilda Pedroza (sister, made 911 call)
- Gabby Hernandez (sister)
- Two brothers (unnamed in sources)
- Jazmine Moreno (partner, mother of his three children)
- Emily Ordaz (daughter)

**Key Quotes:**
- Sheriff Villanueva: "I want to clearly state I have grave concerns regarding this deputy involved shooting."
- DA Gascón: "Unlawful and excessive force at the hands of police erodes the public trust."
- Hilda Pedroza: "We are furious, saddened and disappointed... This trauma is going to affect us for generations."
- Attorney Federico Sayre: Characterized the final shot as "murder"

**Coroner's Report (per lawsuit):**
- All but two bullets struck Ordaz in back and side
- Final bullet struck chest while he was face-up on sidewalk

## Media Used

### Images

1. **Victim portrait** - `4628964e-eb32-4605-9823-a00f649e5e00`
   - Source: LA Times / California Times Brightspot CDN
   - Alt: "David Ordaz Jr., 34-year-old father of three from East Los Angeles"

2. **Memorial posters at courthouse** - `c6850f4c-b941-44b9-682c-32f7dc4dc700`
   - Source: LAist/SCPR
   - Alt: "Memorial posters of David Ordaz Jr. displayed outside Los Angeles County courthouse"

### Videos

1. **LASD Critical Incident Video** - `8e8943934c3922e18fd5d453b6fe7cac`
   - Source: LASD (via Google Drive)
   - Caption: "LASD Critical Incident Video: Deputies fatally shoot David Ordaz Jr. during mental health crisis response"
   - Contains: Body camera footage and 911 call audio

## Notes on Armed Status

While the CSV record had "allegedly_armed" as null/undefined, the case clearly involved Ordaz holding a kitchen knife. Set armed_status to "Armed" but threat_level to "Low Threat" because:
- He was in mental health crisis (suicidal, not homicidal)
- Family called for mental health help
- Deputies had time to request Mental Evaluation Team
- Bean bags were fired first (indicating lower threat assessment)
- Charges focused on continuing to fire after threat ended

## Civil Lawsuit Status

Federal civil rights lawsuit filed July 2021. No settlement information found as of research date. Case appeared to still be pending at time of criminal sentencing (November 2024).

## Edit History

- 2026-01-03: Initial article created from CSV data and web research
