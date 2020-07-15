const fs = require('fs')
const os = require('os')
const moment = require('moment')

const fileArg = process.argv[2]
const NirvanaJSON = JSON.parse(fs.readFileSync(fileArg, 'utf8'))

// The result file
const datetime = moment(new Date()).format('YYYY-MM-DTHH.mm.ss')
const appendResult = (data) => {
  fs.appendFile(`${datetime}-nirvana-nozbe-export.txt`, data, (err) => {
    if (err) throw err
  })
}

// Remove dastardly left margin from indented multi-line templates literals
const dedent = (string, ...expressions) =>
  string
    .reduce((acc, cur, i) => acc + expressions[i - 1] + cur)
    .replace(/\r?(\n)\s*\^/g, '$1')

// Take a date from Nirvana data like "20200701" and make it a real date
const basicDateToNozbe = (d) => {
  const realDate = moment(d, 'YYYYMMDD')
  return `${realDate.format('MMMM')} ${realDate.format('D')}`
}

// Stats for nerds
const NirvanaItemCount = NirvanaJSON.length

// Map state number values from the export data to meaningful words
const stateMap = {
  0: {
    NirvanaName: 'Inbox'
  },
  1: {
    NirvanaName: 'Next'
  },
  2: {
    NirvanaName: 'Waiting',
    NozbeHash: '#Waiting'
  },
  3: {
    NirvanaName: 'Scheduled'
  },
  4: {
    NirvanaName: 'Someday',
    NozbeHash: '#Someday'
  },
  // "Later"
  5: {
    NirvanaName: 'Later',
    NozbeHash: '#Later'
  },
  // "Trash"
  6: {
    NirvanaName: 'Trash'
  },
  // "Completed"
  7: {
    NirvanaName: 'Completed'
  },
  // 8: ¯\_(ツ)_/¯,
  9: {
    NirvanaName: 'Repeating'
  },
  // 10: ¯\_(ツ)_/¯,
  11: {
    NirvanaName: 'Active Project'
  }
}

// Map levels of energy required according to Nirvana
const energyMap = {
  0: '',
  1: 'Energy: Low',
  2: 'Energy: Medium',
  3: 'Energy: High'
}

// Get a separate list of projects
const NirvanaProjects = NirvanaJSON.filter((x) => x.type === '1')

function exportNirvana () {
  NirvanaJSON.forEach((nItem) => {
    const bail =
      nItem.completed !== '0' ||
      // Item is a project
      nItem.type === '1' ||
      // Item is complete
      nItem.state === '7'
    if (bail) return

    // Gather vars from the original data
    const {
      name,
      note,
      tags,
      parentid,
      state,
      energy,
      startdate,
      duedate,
      recurring
    } = nItem

    // A stack of Nozbe hashtags, like: ['#Project Name', '#January 1st', ...]
    let NozbeHashArr = []

    // Add Nozbe categories based on Nirvana's state for the task
    const stateHash = stateMap[state].NozbeHash
    if (stateHash) NozbeHashArr.push(stateHash)

    // Look for a due date or start date to use as the due date
    const hasDate = startdate.length > 0 || duedate.length > 0
    if (hasDate) NozbeHashArr.push(`#${basicDateToNozbe(duedate || startdate)}`)

    // Set the energy rating from Nirvana as a hard-coded Nozbe Category
    const energyLevel = energyMap[energy]
    if (energyLevel.length) NozbeHashArr.push(`#${energyLevel}`)

    // Get the task's tags (includes Areas, Contexts, Agendas, Generic)
    const categories = tags.split(',').slice(1, -1).map((cat) => `#${cat}`)
    if (categories.length > 0) NozbeHashArr = NozbeHashArr.concat(categories)

    // Check if the task belongs to a Project
    const matchingProject = NirvanaProjects.find((x) => x.id === parentid)
    const projectName = matchingProject
      ? matchingProject.name
      : false
    // Process the parent projects tags as if they were our own
    const projectTags = matchingProject
      ? matchingProject.tags.split(',').slice(1, -1).map((cat) => `#${cat}`)
      : false
    if (projectName) NozbeHashArr.push(`#${projectName}`)
    if (projectTags) NozbeHashArr = NozbeHashArr.concat(projectTags)

    // Use a Set to deduplicate the array of hashtags
    const NozbeHashSet = [...new Set(NozbeHashArr)]

    let result = dedent`
      ^
      ^. ${name} ${[...NozbeHashSet].join(' ')}
      ^${note}
    `.trim() + os.EOL + os.EOL
    if (recurring.length > 0) {
      const prettyJSON = JSON.parse(recurring, null, 4)
      const JSONstring = JSON.stringify(prettyJSON, null, '····')
      result += dedent`
        ^${os.EOL}
        ^
        ^ ****************************************
        ^
        ^*Automated message from Nirvana import: you have a repeating task to restore:*
        ^
        ^ \`\`\`json
        ^${JSONstring}
        ^ \`\`\`
      `.trim() + os.EOL + os.EOL
    }
    appendResult(result)
  })
}

(async () => {
  await exportNirvana()
  const log = dedent`
    ^
    ^--
    ^ Automated export from http://github.com/sh78/nirvana-email-to-nozbe
    ^ Processed ${NirvanaItemCount} items from Nirvana.
  `.trim()
  appendResult(log)
})()
