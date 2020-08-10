class Instruction {
    constructor(inst, cycles) {

        this.inst = inst;
        this.opcode = inst.split(" ")[0];
        this.resto = inst.split(" ")[1].split(","); 

        switch (this.opcode) {
            case "SD":
                this.type = "S";
                this.i = this.resto[0];
                this.j = this.resto[1].split("(")[0]; // offset
                this.k = this.resto[1].split("(")[1].split(")")[0]; // base
                break;
            case "LD":
                this.type = "L";
                this.i = this.resto[0];
                this.j = this.resto[1].split("(")[0]; // offset
                this.k = this.resto[1].split("(")[1].split(")")[0]; // base

                break;
            case "MULTD":
            case "DIVD":
            case "ADDD":
            case "SUBD":
                this.type = "F";
                this.i = this.resto[0];
                this.j = this.resto[1]; // j
                this.k = this.resto[2]; // k
                break;
            case "ADD":
            case "DADDUI":
                this.type = "R";
                this.i = this.resto[0];
                this.j = this.resto[1]; // j
                this.k = this.resto[2]; // k
                break;
            case "BEQ":
                this.type = "B"
                this.i = this.resto[2]; // i
                this.j = this.resto[0]; // j
                this.k = this.resto[1];
                break;
            case "BNEZ":
                this.type = "B";
                this.i = this.resto[1]; // i
                this.j = this.resto[0];
                break;
        }
        this.cycles = cycles;
    }
}

class ReservationStation {
    constructor() {
        this.instruction = null;
        this.busy = false;
        this.opcode = null;
        this.vj = null;
        this.vk = null;
        this.qj = null;
        this.qk = null;
        this.time = null; 
        this.start = null;
    }

    add_instruction(instruction, rstations, cycle) {
        this.instruction = instruction;
        this.busy = true;
        this.opcode = instruction.opcode;
        // console.log(rstations);
        var j = rstations[0];
        var k = rstations[1];
        if (!j && !k) {
            // caso esteja ok
            this.vj = instruction.j;
            this.vk = instruction.k;
        } else {
            if (j) {
                if (j[0] === "x") {
                    j = j.substr(1);
                    this.vj = j;
                } else {
                    this.qj = rstations[0];
                }
            } else {
                this.vj = instruction.j;
            }
            if (k) {
                if (k[0] === "x") {
                    k = k.substr(1);
                    this.vk = k;
                } else {
                    this.qk = rstations[1];
                }
            } else {
                this.vk = instruction.k;
            }
        }

        this.time = instruction.cycles;
        this.start = cycle;
    }
    clear() {
        this.instruction = null;
        this.busy = false;
        this.opcode = null;
        this.vj = null;
        this.vk = null;
        this.qj = null;
        this.qk = null;
        this.time = null;
        this.start = null;
    }

    busy() {
        return this.busy;
    }

    decrement_time() {
        // para simular passagem de tempo, quando chegar em 0 significa que terminou de executar
        this.time = this.time - 1;
    }
}

class RegisterStatus {
    constructor() {
        this.registers = [];
        this.registers_fp = [];
        for (let i = 0; i < 8; i++) {
            this.registers.push(new Register("R" + i));
            this.registers_fp.push(new Register("F" + (i * 2)));
        }
    }

    get_register(regJ, regK) {
        if (regJ !== undefined) {
            regJ = regJ.split("");
            var typeJ = regJ.shift();
            regJ = regJ.join("");
        }
        if (regK !== undefined) {
            regK = regK.split("");
            var typeK = regK.shift();
            regK = regK.join("");
        }
        var registers = [null, null];
        if (typeJ === "F") {
            registers[0] = (this.registers_fp[(parseInt(regJ) / 2)].station);
        } else if (typeJ === "R") {
            registers[0] = (this.registers[parseInt(regJ)].station);
        }
        if (typeK === "F") {
            registers[1] = (this.registers_fp[(parseInt(regK) / 2)].station);
        } else if (typeK === "R") {
            registers[1] = (this.registers[parseInt(regK)].station);
        }
        return registers;
    }

    add_station(reg, station_type, station_number) {
        reg = reg.split("");
        var type = reg.shift();
        reg = reg.join("");
        if (type === "F") {
            this.registers_fp[(parseInt(reg) / 2)].station = String(station_type) + String(station_number);
        } else if (type === "R") {
            return this.registers[parseInt(reg)].station = String(station_type) + String(station_number);
        }
    }

    get_station(reg) {
        reg = reg.split("");
        var type = reg.shift();
        reg = reg.join("");
        if (type === "F") {
            registers[0] = (this.registers_fp[(parseInt(reg) / 2)].station);
        } else if (type === "R") {
            registers[0] = (this.registers[parseInt(reg)].station);
        }
    }

    update_reg_prefix(reg, station) {
        // usada após escrever
        // coloca um prefixo x no registrador que já terminou exe
        // verifica se a estacao que está no reg é igual a estacao que fez chamar esta funcao
        reg = reg.split("");
        var type = reg.shift();
        reg = reg.join("");
        if (type === "F") {
            if (this.registers_fp[(parseInt(reg) / 2)].station === station) {
                this.registers_fp[(parseInt(reg) / 2)].station = "x" + this.registers_fp[(parseInt(reg) / 2)].station;
            }
        } else if (type === "R") {
            if (this.registers[parseInt(reg)].station === station) {
                this.registers[parseInt(reg)].station = "x" + this.registers[parseInt(reg)].station;
            }
        }
    }

}

class Register {
    constructor(name) {
        this.name = name;
        this.station = null;
    }
}

class ExeUnit {
    constructor() {
        this.integer_unit = []; // 3
        this.float_add_sub_unit = []; // 3
        this.float_mult_div_unit = []; // 2
        this.store_unit = []; // 3
        this.load_unit = []; // 6

        this.registers = new RegisterStatus();

        // inicializar unidades
        for (let i = 0; i < 3; i++) {
            // inicializando unidade de inteiro
            this.integer_unit.push(new ReservationStation());
            // inicializando unidade de ponto flutuante - addsub
            this.float_add_sub_unit.push(new ReservationStation());
            // inicializando unidade de store - talvez mudar
            this.store_unit.push(new ReservationStation());
            // inicializando unidade de load - talvez mudar
            this.load_unit.push(new ReservationStation());
            this.load_unit.push(new ReservationStation());
        }
        for (let i = 0; i < 2; i++) {
            // inicializando unidade de ponto flutuante - multdiv
            this.float_mult_div_unit.push(new ReservationStation());
        }
    }

    station_status() {
        for (let i = 0; i < 3; i++) {
            // INT
            $(`#IADDbusy${i}`).text(this.integer_unit[i].busy);
            if(this.integer_unit[i].busy) {
                $(`#IADDtime${i}`).text(this.integer_unit[i].time);
                $(`#IADDop${i}`).text(this.integer_unit[i].opcode);
                if (this.integer_unit[i].vj) {
                    $(`#IADDvj${i}`).text(this.integer_unit[i].vj);
                } else {
                    $(`#IADDvj${i}`).text("");
                }
                if (this.integer_unit[i].vk) {
                    $(`#IADDvk${i}`).text(this.integer_unit[i].vk);
                } else {
                    $(`#IADDvk${i}`).text("");
                }
                if (this.integer_unit[i].qj) {
                    $(`#IADDqj${i}`).text(this.integer_unit[i].qj);
                } else {
                    $(`#IADDqj${i}`).text("");
                }
                if (this.integer_unit[i].qk) {
                    $(`#IADDqk${i}`).text(this.integer_unit[i].qk);
                } else {
                    $(`#IADDqk${i}`).text("");
                }
            } else {
                $(`#IADDtime${i}`).text("");
                $(`#IADDop${i}`).text("");
                $(`#IADDvj${i}`).text("");
                $(`#IADDvk${i}`).text("");
                $(`#IADDqj${i}`).text("");
                $(`#IADDqk${i}`).text("");
            }
            // FADD
            $(`#FADDbusy${i}`).text(this.float_add_sub_unit[i].busy);
            if(this.float_add_sub_unit[i].busy) {
                $(`#FADDtime${i}`).text(this.float_add_sub_unit[i].time);
                $(`#FADDop${i}`).text(this.float_add_sub_unit[i].opcode);
                if (this.float_add_sub_unit[i].vj) {
                    $(`#FADDvj${i}`).text(this.float_add_sub_unit[i].vj);
                } else {
                    $(`#FADDvj${i}`).text("");
                }
                if (this.float_add_sub_unit[i].vk) {
                    $(`#FADDvk${i}`).text(this.float_add_sub_unit[i].vk);
                } else {
                    $(`#FADDvk${i}`).text("");
                }
                if (this.float_add_sub_unit[i].qj) {
                    $(`#FADDqj${i}`).text(this.float_add_sub_unit[i].qj);
                } else {
                    $(`#FADDqj${i}`).text("");
                }
                if (this.float_add_sub_unit[i].qk) {
                    $(`#FADDqk${i}`).text(this.float_add_sub_unit[i].qk);
                } else {
                    $(`#FADDqk${i}`).text("");
                }
            } else {
                $(`#FADDtime${i}`).text("");
                $(`#FADDop${i}`).text("");
                $(`#FADDvj${i}`).text("");
                $(`#FADDvk${i}`).text("");
                $(`#FADDqj${i}`).text("");
                $(`#FADDqk${i}`).text("");
            }
            // LD
            $(`#LUbusy${i}`).text(this.load_unit[i].busy);
            $(`#LUbusy${(i + 3)}`).text(this.load_unit[i + 3].busy);
            if(this.load_unit[i].busy) {
                $(`#LUtime${i}`).text(this.load_unit[i].time);
                $(`#LUop${i}`).text(this.load_unit[i].opcode);
                if (this.load_unit[i].vj) {
                    $(`#LUvj${i}`).text(this.load_unit[i].vj);
                } else {
                    $(`#LUvj${i}`).text("");
                }
                if (this.load_unit[i].vk) {
                    $(`#LUvk${i}`).text(this.load_unit[i].vk);
                } else {
                    $(`#LUvk${i}`).text("");
                }
                if (this.load_unit[i].qj) {
                    $(`#LUqj${i}`).text(this.load_unit[i].qj);
                } else {
                    $(`#LUqj${i}`).text("");
                }
                if (this.load_unit[i].qk) {
                    $(`#LUqk${i}`).text(this.load_unit[i].qk);
                } else {
                    $(`#LUqk${i}`).text("");
                }
            } else {
                $(`#LUtime${i}`).text("");
                $(`#LUop${i}`).text("");
                $(`#LUvj${i}`).text("");
                $(`#LUvk${i}`).text("");
                $(`#LUqj${i}`).text("");
                $(`#LUqk${i}`).text("");
            }
            if(this.load_unit[i + 3].busy) {
                $(`#LUtime${(i + 3)}`).text(this.load_unit[i + 3].time);
                $(`#LUop${(i + 3)}`).text(this.load_unit[i + 3].opcode);
                if (this.load_unit[i + 3].vj) {
                    $(`#LUvj${(i + 3)}`).text(this.load_unit[i + 3].vj);
                } else {
                    $(`#LUvj${(i + 3)}`).text("");
                }
                if (this.load_unit[i + 3].vk) {
                    $(`#LUvk${(i + 3)}`).text(this.load_unit[i + 3].vk);
                } else {
                    $(`#LUvk${(i + 3)}`).text("");
                }
                if (this.load_unit[i + 3].qj) {
                    $(`#LUqj${(i + 3)}`).text(this.load_unit[i + 3].qj);
                } else {
                    $(`#LUqj${(i + 3)}`).text("");
                }
                if (this.load_unit[i + 3].qk) {
                    $(`#LUqk${(i + 3)}`).text(this.load_unit[i + 3].qk);
                } else {
                    $(`#LUqk${(i + 3)}`).text("");
                }
            } else {
                $(`#LUtime${(i + 3)}`).text("");
                $(`#LUop${(i + 3)}`).text("");
                $(`#LUvj${(i + 3)}`).text("");
                $(`#LUvk${(i + 3)}`).text("");
                $(`#LUqj${(i + 3)}`).text("");
                $(`#LUqk${(i + 3)}`).text("");
            }
            // SD
            $(`#SUbusy${i}`).text(this.store_unit[i].busy);
            if(this.store_unit[i].busy) {
                $(`#SUtime${i}`).text(this.store_unit[i].time);
                $(`#SUop${i}`).text(this.store_unit[i].opcode);
                if (this.store_unit[i].vj) {
                    $(`#SUvj${i}`).text(this.store_unit[i].vj);
                } else {
                    $(`#SUvj${i}`).text("");
                }
                if (this.store_unit[i].vk) {
                    $(`#SUvk${i}`).text(this.store_unit[i].vk);
                } else {
                    $(`#SUvk${i}`).text("");
                }
                if (this.store_unit[i].qj) {
                    $(`#SUqj${i}`).text(this.store_unit[i].qj);
                } else {
                    $(`#SUqj${i}`).text("");
                }
                if (this.store_unit[i].qk) {
                    $(`#SUqk${i}`).text(this.store_unit[i].qk);
                } else {
                    $(`#SUqk${i}`).text("");
                }
            } else {
                $(`#SUtime${i}`).text("");
                $(`#SUop${i}`).text("");
                $(`#SUvj${i}`).text("");
                $(`#SUvk${i}`).text("");
                $(`#SUqj${i}`).text("");
                $(`#SUqk${i}`).text("");
            }

        }
        for (let i = 0; i < 2; i++) {
            // MD
            $(`#MDbusy${i}`).text(this.float_mult_div_unit[i].busy);
            if(this.float_mult_div_unit[i].busy) {
                $(`#MDtime${i}`).text(this.float_mult_div_unit[i].time);
                $(`#MDop${i}`).text(this.float_mult_div_unit[i].opcode);
                if (this.float_mult_div_unit[i].vj) {
                    $(`#MDvj${i}`).text(this.float_mult_div_unit[i].vj);
                } else {
                    $(`#MDvj${i}`).text("");
                }
                if (this.float_mult_div_unit[i].vk) {
                    $(`#MDvk${i}`).text(this.float_mult_div_unit[i].vk);
                } else {
                    $(`#MDvk${i}`).text("");
                }
                if (this.float_mult_div_unit[i].qj) {
                    $(`#MDqj${i}`).text(this.float_mult_div_unit[i].qj);
                } else {
                    $(`#MDqj${i}`).text("");
                }
                if (this.float_mult_div_unit[i].qk) {
                    $(`#MDqk${i}`).text(this.float_mult_div_unit[i].qk);
                } else {
                    $(`#MDqk${i}`).text("");
                }
            } else {
                $(`#MDtime${i}`).text("");
                $(`#MDop${i}`).text("");
                $(`#MDvj${i}`).text("");
                $(`#MDvk${i}`).text("");
                $(`#MDqj${i}`).text("");
                $(`#MDqk${i}`).text("");
            }
        }
        for (let i = 0; i < 8; i++) {
            if (this.registers.registers[i].station) {
                $(`#R${i}`).text(this.registers.registers[i].station);
            } 
            if (this.registers.registers_fp[i].station) {
                $(`#F${(i * 2)}`).text(this.registers.registers_fp[i].station);
            } 
            
        }
        //// console.log(this.registers);
    }

    add_to_station(instruction, cycle) {
        // auxiliar de issue()
        var rstations = this.registers.get_register(instruction.j, instruction.k);
        console.log(rstations);
        if (instruction.type === "R") {
            for (let i = 0; i < this.integer_unit.length; i++) {
                if (!this.integer_unit[i].busy) {
                    // tem station disponivel
                    this.integer_unit[i].add_instruction(instruction, rstations, cycle);
                    this.registers.add_station(instruction.i, "IntegerUnit", i);
                    return true; // true adicionou
                }
            }
            return false;
        }
        else if (instruction.type === "L") {
            for (let i = 0; i < this.load_unit.length; i++) {
                if (!this.load_unit[i].busy) {
                    // tem station disponivel
                    this.load_unit[i].add_instruction(instruction, rstations, cycle);
                    // LD
                    this.registers.add_station(instruction.i, "LoadUnit", i);
                    return true; // true adicionou
                }
            }
            return false; // false nao adicionou
        }
        else if (instruction.type === "B") {
            for (let i = 0; i < this.integer_unit.length; i++) {
                if (!this.integer_unit[i].busy) {
                    // tem station disponivel
                    this.integer_unit[i].add_instruction(instruction, rstations, cycle);
                    this.registers.add_station(instruction.j, "IntegerUnit", i);
                    if (instruction.k !== undefined) {
                        this.registers.add_station(instruction.k, "IntegerUnit", i);
                    }
                    return true; // true adicionou
                }
            }
            return false; // false nao adicionou
        } else if (instruction.type === "F") {
            if (instruction.opcode === "MULTD" || instruction.opcode === "DIVD") {
                for (let i = 0; i < this.float_mult_div_unit.length; i++) {

                    if (!this.float_mult_div_unit[i].busy) {

                        // tem station disponivel
                        this.float_mult_div_unit[i].add_instruction(instruction, rstations, cycle);
                        this.registers.add_station(instruction.i, "MultDiv", i);
                        return true; // true adicionou
                    }
                }
                return false; // false nao adicionou
            } else {
                for (let i = 0; i < this.float_add_sub_unit.length; i++) {
                    if (!this.float_add_sub_unit[i].busy) {
                        // tem station disponivel
                        this.float_add_sub_unit[i].add_instruction(instruction, rstations, cycle);
                        this.registers.add_station(instruction.i, "FAddSub", i);
                        return true; // true adicionou
                    }
                }
                return false;
            }
        }
        else {
            // instrucao do tipo S
            for (let i = 0; i < this.store_unit.length; i++) {
                if (!this.store_unit[i].busy) {
                    // tem station disponivel
                    this.store_unit[i].add_instruction(instruction, rstations, cycle);
                    this.registers.add_station(instruction.i, "StoreUnit", i);
                    return true; // true adicionou
                }
            }
            return false; // false nao adicionou
        }
    }

    run_stations(cycle) {
        // auxiliar de execute()
        // percorre todas stations e verifica se pode decrementar
        // decrementar no caso: simular execucão, passagem de um ciclo

        var stations_finished = []; // guarda as stations que terminaram de executar
        for (let i = 0; i < 3; i++) {
            // unidades de inteiro
            if (this.integer_unit[i].busy) {
                // nesse caso tem instrucao
                if (this.integer_unit[i].qj === null && this.integer_unit[i].qk === null && this.integer_unit[i].start !== cycle) {
                    // nesse caso, está pronto para executar
                    this.integer_unit[i].decrement_time();
                    if (this.integer_unit[i].time === 0) {
                        stations_finished.push(this.integer_unit[i]);
                    }
                }
            }

            if (this.float_add_sub_unit[i].busy) {
                if (this.float_add_sub_unit[i].qj === null && this.float_add_sub_unit[i].qk === null && this.float_add_sub_unit[i].start !== cycle) {
                    this.float_add_sub_unit[i].decrement_time();
                    if (this.float_add_sub_unit[i].time === 0) {
                        stations_finished.push(this.float_add_sub_unit[i]);
                    }
                }
            }

            if (this.store_unit[i].busy) {
                // nesse caso tem instrucao
                if (this.store_unit[i].qj === null && this.store_unit[i].qk === null && this.store_unit[i].start !== cycle) {
                    // nesse caso, está pronto para executar
                    this.store_unit[i].decrement_time();
                    if (this.store_unit[i].time === 0) {
                        stations_finished.push(this.store_unit[i]);
                    }
                }
            }

            if (this.load_unit[i].busy) {
                // nesse caso tem instrucao
                if (this.load_unit[i].qj === null && this.load_unit[i].qk === null && this.load_unit[i].start !== cycle) {
                    // nesse caso, está pronto para executar
                    this.load_unit[i].decrement_time();
                    if (this.load_unit[i].time === 0) {
                        stations_finished.push(this.load_unit[i]);
                    }
                }
            }

            if (this.load_unit[i + 3].busy) {
                // nesse caso tem instrucao
                if (this.load_unit[i + 3].qj === null && this.load_unit[i + 3].qk === null && this.load_unit[i + 3].start !== cycle) {
                    // nesse caso, está pronto para executar
                    this.load_unit[i + 3].decrement_time();
                    if (this.load_unit[i + 3].time === 0) {
                        stations_finished.push(this.load_unit[i + 3]);
                    }
                }
            }
        }

        for (let i = 0; i < 2; i++) {
            // inicializando unidade de ponto flutuante - multdiv
            if (this.float_mult_div_unit[i].busy) {
                if (this.float_mult_div_unit[i].qj === null && this.float_mult_div_unit[i].qk === null && this.float_mult_div_unit[i].start !== cycle) {
                    this.float_mult_div_unit[i].decrement_time();
                    if (this.float_mult_div_unit[i].time === 0) {
                        stations_finished.push(this.float_mult_div_unit[i]);
                    }
                }
            }
        }
        return stations_finished;
    }

    remove_from_station(instruction) {
        // auxiliar de write()
        // percorre registers caçando x ?
        // remove a instrucao que escreveu
        // acessa os registradores que fazem algo nela
        // e coloca o prefixo x
        // verifica tipo da instrucao
        // percorre as estacoes daquele tipo
        // acha a estacao da instruction
        // verifica em todas as estacoes se ela está em qj ou qk
        if (instruction.type === "R" || instruction.type === "B") {
            for (let i = 0; i < this.integer_unit.length; i++) {
                if (this.integer_unit[i].instruction === instruction) {
                    // instruction i = o que foi escrito
                    // pode ser o j e o k de algum
                    for (let j = 0; j < 3; j++) {
                        // para inteiro e B
                        if (this.integer_unit[j].qj === ("IntegerUnit" + i)) {
                            this.integer_unit[j].vj = "x" + this.integer_unit[j].qj;
                            this.integer_unit[j].qj = null;
                        }
                        if (this.integer_unit[j].qk === ("IntegerUnit" + i)) {
                            this.integer_unit[j].vk = "x" + this.integer_unit[j].qk;
                            this.integer_unit[j].qk = null;
                        }

                        // para float addsub
                        // console.log(this.float_add_sub_unit[j].qj);
                        if (this.float_add_sub_unit[j].qj === ("IntegerUnit" + i)) {
                            // console.log("caiu aqui");
                            this.float_add_sub_unit[j].vj = "x" + this.float_add_sub_unit[j].qj;
                            this.float_add_sub_unit[j].qj = null;
                        }
                        if (this.float_add_sub_unit[j].qk === ("IntegerUnit" + i)) {
                            this.float_add_sub_unit[j].vk = "x" + this.float_add_sub_unit[j].qk;
                            this.float_add_sub_unit[j].qk = null;
                        }
                        // para load
                        if (this.load_unit[j].qj === ("IntegerUnit" + i)) {
                            // console.log("caiu aqui");
                            this.load_unit[j].vj = "x" + this.load_unit[j].qj;
                            this.load_unit[j].qj = null;
                        }
                        if (this.load_unit[j].qk === ("IntegerUnit" + i)) {
                            this.load_unit[j].vk = "x" + this.load_unit[j].qk;
                            this.load_unit[j].qk = null;
                        }

                        if (this.load_unit[j + 3].qj === ("IntegerUnit" + i)) {
                            // console.log("caiu aqui");
                            this.load_unit[j + 3].vj = "x" + this.load_unit[j + 3].qj;
                            this.load_unit[j + 3].qj = null;
                        }
                        if (this.load_unit[j + 3].qk === ("IntegerUnit" + i)) {
                            this.load_unit[j + 3].vk = "x" + this.load_unit[j + 3].qk;
                            this.load_unit[j + 3].qk = null;
                        }

                        // para store
                        if (this.store_unit[j].qj === ("IntegerUnit" + i)) {
                            // console.log("caiu aqui");
                            this.store_unit[j].vj = "x" + this.store_unit[j].qj;
                            this.store_unit[j].qj = null;
                        }
                        if (this.store_unit[j].qk === ("IntegerUnit" + i)) {
                            this.store_unit[j].vk = "x" + this.store_unit[j].qk;
                            this.store_unit[j].qk = null;
                        }

                    }

                    for (let j = 0; j < 2; j++) {
                        // para float multdiv
                        if (this.float_mult_div_unit[j].qj === ("IntegerUnit" + i)) {
                            this.float_mult_div_unit[j].vj = "x" + this.float_mult_div_unit[j].qj;
                            this.float_mult_div_unit[j].qj = null;
                        }
                        if (this.float_mult_div_unit[j].qk === ("IntegerUnit" + i)) {
                            this.float_mult_div_unit[j].vk = "x" + this.float_mult_div_unit[j].qk;
                            this.float_mult_div_unit[j].qk = null;
                        }
                    }
                    if (instruction.opcode === "BEQ") {
                        this.registers.update_reg_prefix(instruction.j, ("IntegerUnit" + i));
                        this.registers.update_reg_prefix(instruction.k, ("IntegerUnit" + i));
                    } else if (instruction.opcode === "BNEZ") {
                        this.registers.update_reg_prefix(instruction.j, ("IntegerUnit" + i));
                    } else {
                        this.registers.update_reg_prefix(instruction.i, ("IntegerUnit" + i));
                    }
                    this.integer_unit[i].clear();
                    return;
                }
            }
        } else if (instruction.type === "S") {
            for (let i = 0; i < this.store_unit.length; i++) {
                if (this.store_unit[i].instruction === instruction) {
                    // instruction i = o que foi escrito
                    // pode ser o j e o k de algum
                    for (let j = 0; j < 3; j++) {
                        // para inteiro e B
                        if (this.integer_unit[j].qj === ("StoreUnit" + i)) {
                            this.integer_unit[j].vj = "x" + this.integer_unit[j].qj;
                            this.integer_unit[j].qj = null;
                        }
                        if (this.integer_unit[j].qk === ("StoreUnit" + i)) {
                            this.integer_unit[j].vk = "x" + this.integer_unit[j].qk;
                            this.integer_unit[j].qk = null;
                        }

                        // para float addsub
                        // console.log(this.float_add_sub_unit[j].qj);
                        if (this.float_add_sub_unit[j].qj === ("StoreUnit" + i)) {
                            // console.log("caiu aqui");
                            this.float_add_sub_unit[j].vj = "x" + this.float_add_sub_unit[j].qj;
                            this.float_add_sub_unit[j].qj = null;
                        }
                        if (this.float_add_sub_unit[j].qk === ("StoreUnit" + i)) {
                            this.float_add_sub_unit[j].vk = "x" + this.float_add_sub_unit[j].qk;
                            this.float_add_sub_unit[j].qk = null;
                        }
                        // para load
                        if (this.load_unit[j].qj === ("StoreUnit" + i)) {
                            // console.log("caiu aqui");
                            this.load_unit[j].vj = "x" + this.load_unit[j].qj;
                            this.load_unit[j].qj = null;
                        }
                        if (this.load_unit[j].qk === ("StoreUnit" + i)) {
                            this.load_unit[j].vk = "x" + this.load_unit[j].qk;
                            this.load_unit[j].qk = null;
                        }

                        if (this.load_unit[j + 3].qj === ("StoreUnit" + i)) {
                            // console.log("caiu aqui");
                            this.load_unit[j + 3].vj = "x" + this.load_unit[j + 3].qj;
                            this.load_unit[j + 3].qj = null;
                        }
                        if (this.load_unit[j + 3].qk === ("StoreUnit" + i)) {
                            this.load_unit[j + 3].vk = "x" + this.load_unit[j + 3].qk;
                            this.load_unit[j + 3].qk = null;
                        }

                        // para store
                        if (this.store_unit[j].qj === ("StoreUnit" + i)) {
                            // console.log("caiu aqui");
                            this.store_unit[j].vj = "x" + this.store_unit[j].qj;
                            this.store_unit[j].qj = null;
                        }
                        if (this.store_unit[j].qk === ("StoreUnit" + i)) {
                            this.store_unit[j].vk = "x" + this.store_unit[j].qk;
                            this.store_unit[j].qk = null;
                        }
                    }
                    for (let j = 0; j < 2; j++) {
                        // para float multdiv
                        if (this.float_mult_div_unit[j].qj === ("StoreUnit" + i)) {
                            this.float_mult_div_unit[j].vj = "x" + this.float_mult_div_unit[j].qj;
                            this.float_mult_div_unit[j].qj = null;
                        }
                        if (this.float_mult_div_unit[j].qk === ("StoreUnit" + i)) {
                            this.float_mult_div_unit[j].vk = "x" + this.float_mult_div_unit[j].qk;
                            this.float_mult_div_unit[j].qk = null;
                        }
                    }
                    this.registers.update_reg_prefix(instruction.i, ("StoreUnit" + i));
                    this.store_unit[i].clear();
                    return;
                }
            }
        } else if (instruction.type === "L") {
            for (let i = 0; i < this.load_unit.length; i++) {
                if (this.load_unit[i].instruction === instruction) {
                    // instruction i = o que foi escrito
                    // pode ser o j e o k de algum
                    for (let j = 0; j < 3; j++) {
                        // para inteiro e B
                        if (this.integer_unit[j].qj === ("LoadUnit" + i)) {
                            this.integer_unit[j].vj = "x" + this.integer_unit[j].qj;
                            this.integer_unit[j].qj = null;
                        }
                        if (this.integer_unit[j].qk === ("LoadUnit" + i)) {
                            this.integer_unit[j].vk = "x" + this.integer_unit[j].qk;
                            this.integer_unit[j].qk = null;
                        }

                        // para float addsub
                        // console.log(this.float_add_sub_unit[j].qj);
                        if (this.float_add_sub_unit[j].qj === ("LoadUnit" + i)) {
                            // console.log("caiu aqui");
                            this.float_add_sub_unit[j].vj = "x" + this.float_add_sub_unit[j].qj;
                            this.float_add_sub_unit[j].qj = null;
                        }
                        if (this.float_add_sub_unit[j].qk === ("LoadUnit" + i)) {
                            this.float_add_sub_unit[j].vk = "x" + this.float_add_sub_unit[j].qk;
                            this.float_add_sub_unit[j].qk = null;
                        }
                        // para load
                        if (this.load_unit[j].qj === ("LoadUnit" + i)) {
                            // console.log("caiu aqui");
                            this.load_unit[j].vj = "x" + this.load_unit[j].qj;
                            this.load_unit[j].qj = null;
                        }
                        if (this.load_unit[j].qk === ("LoadUnit" + i)) {
                            this.load_unit[j].vk = "x" + this.load_unit[j].qk;
                            this.load_unit[j].qk = null;
                        }

                        if (this.load_unit[j + 3].qj === ("LoadUnit" + i)) {
                            // console.log("caiu aqui");
                            this.load_unit[j + 3].vj = "x" + this.load_unit[j + 3].qj;
                            this.load_unit[j + 3].qj = null;
                        }
                        if (this.load_unit[j + 3].qk === ("LoadUnit" + i)) {
                            this.load_unit[j + 3].vk = "x" + this.load_unit[j + 3].qk;
                            this.load_unit[j + 3].qk = null;
                        }

                        // para store
                        if (this.store_unit[j].qj === ("LoadUnit" + i)) {
                            // console.log("caiu aqui");
                            this.store_unit[j].vj = "x" + this.store_unit[j].qj;
                            this.store_unit[j].qj = null;
                        }
                        if (this.store_unit[j].qk === ("LoadUnit" + i)) {
                            this.store_unit[j].vk = "x" + this.store_unit[j].qk;
                            this.store_unit[j].qk = null;
                        }

                    }
                    for (let j = 0; j < 2; j++) {
                        // para float multdiv
                        if (this.float_mult_div_unit[j].qj === ("LoadUnit" + i)) {
                            this.float_mult_div_unit[j].vj = "x" + this.float_mult_div_unit[j].qj;
                            this.float_mult_div_unit[j].qj = null;
                        }
                        if (this.float_mult_div_unit[j].qk === ("LoadUnit" + i)) {
                            this.float_mult_div_unit[j].vk = "x" + this.float_mult_div_unit[j].qk;
                            this.float_mult_div_unit[j].qk = null;
                        }
                    }
                    this.registers.update_reg_prefix(instruction.i, ("LoadUnit" + i));
                    this.load_unit[i].clear();
                    return;
                }
            }
        } else if (instruction.type === "F") {
            if (instruction.opcode === "MULTD" || instruction.opcode === "DIVD") {
                for (let i = 0; i < this.float_mult_div_unit.length; i++) {
                    if (this.float_mult_div_unit[i].instruction === instruction) {
                        for (let j = 0; j < 3; j++) {
                            // para float addsub
                            // console.log(this.float_add_sub_unit[j].qj);
                            if (this.float_add_sub_unit[j].qj === ("MultDiv" + i)) {
                                // console.log("caiu aqui");
                                this.float_add_sub_unit[j].vj = "x" + this.float_add_sub_unit[j].qj;
                                this.float_add_sub_unit[j].qj = null;
                            }
                            if (this.float_add_sub_unit[j].qk === ("MultDiv" + i)) {
                                this.float_add_sub_unit[j].vk = "x" + this.float_add_sub_unit[j].qk;
                                this.float_add_sub_unit[j].qk = null;
                            }
                            // para outras instrucoes - LD e SD

                            // para load
                            if (this.load_unit[j].qj === ("MultDiv" + i)) {
                                // console.log("caiu aqui");
                                this.load_unit[j].vj = "x" + this.load_unit[j].qj;
                                this.load_unit[j].qj = null;
                            }
                            if (this.load_unit[j].qk === ("MultDiv" + i)) {
                                this.load_unit[j].vk = "x" + this.load_unit[j].qk;
                                this.load_unit[j].qk = null;
                            }

                            if (this.load_unit[j + 3].qj === ("MultDiv" + i)) {
                                // console.log("caiu aqui");
                                this.load_unit[j + 3].vj = "x" + this.load_unit[j + 3].qj;
                                this.load_unit[j + 3].qj = null;
                            }
                            if (this.load_unit[j + 3].qk === ("MultDiv" + i)) {
                                this.load_unit[j + 3].vk = "x" + this.load_unit[j + 3].qk;
                                this.load_unit[j + 3].qk = null;
                            }

                            // para store
                            if (this.store_unit[j].qj === ("MultDiv" + i)) {
                                // console.log("caiu aqui");
                                this.store_unit[j].vj = "x" + this.store_unit[j].qj;
                                this.store_unit[j].qj = null;
                            }
                            if (this.store_unit[j].qk === ("MultDiv" + i)) {
                                this.store_unit[j].vk = "x" + this.store_unit[j].qk;
                                this.store_unit[j].qk = null;
                            }

                        }

                        for (let j = 0; j < 2; j++) {
                            // para float multdiv
                            if (this.float_mult_div_unit[j].qj === ("MultDiv" + i)) {
                                this.float_mult_div_unit[j].vj = "x" + this.float_mult_div_unit[j].qj;
                                this.float_mult_div_unit[j].qj = null;
                            }
                            if (this.float_mult_div_unit[j].qk === ("MultDiv" + i)) {
                                this.float_mult_div_unit[j].vk = "x" + this.float_mult_div_unit[j].qk;
                                this.float_mult_div_unit[j].qk = null;
                            }
                        }
                        this.registers.update_reg_prefix(instruction.i, ("MultDiv" + i));
                        this.float_mult_div_unit[i].clear();
                        return;
                    }

                }
            } else {
                for (let i = 0; i < this.float_add_sub_unit.length; i++) {
                    if (this.float_add_sub_unit[i].instruction === instruction) {
                        for (let j = 0; j < 3; j++) {
                            // para float addsub
                            if (this.float_add_sub_unit[j].qj === ("FAddSub" + i)) {
                                this.float_add_sub_unit[j].vj = "x" + this.float_add_sub_unit[j].qj;
                                this.float_add_sub_unit[j].qj = null;
                            }
                            if (this.float_add_sub_unit[j].qk === ("FAddSub" + i)) {
                                this.float_add_sub_unit[j].vk = "x" + this.float_add_sub_unit[j].qk;
                                this.float_add_sub_unit[j].qk = null;
                            }
                            // para outras instrucoes - LD e SD

                            // para load
                            if (this.load_unit[j].qj === ("FAddSub" + i)) {
                                // console.log("caiu aqui");
                                this.load_unit[j].vj = "x" + this.load_unit[j].qj;
                                this.load_unit[j].qj = null;
                            }
                            if (this.load_unit[j].qk === ("FAddSub" + i)) {
                                this.load_unit[j].vk = "x" + this.load_unit[j].qk;
                                this.load_unit[j].qk = null;
                            }

                            if (this.load_unit[j + 3].qj === ("FAddSub" + i)) {
                                // console.log("caiu aqui");
                                this.load_unit[j + 3].vj = "x" + this.load_unit[j + 3].qj;
                                this.load_unit[j + 3].qj = null;
                            }
                            if (this.load_unit[j + 3].qk === ("FAddSub" + i)) {
                                this.load_unit[j + 3].vk = "x" + this.load_unit[j + 3].qk;
                                this.load_unit[j + 3].qk = null;
                            }

                            // para store
                            if (this.store_unit[j].qj === ("FAddSub" + i)) {
                                // console.log("caiu aqui");
                                this.store_unit[j].vj = "x" + this.store_unit[j].qj;
                                this.store_unit[j].qj = null;
                            }
                            if (this.store_unit[j].qk === ("FAddSub" + i)) {
                                this.store_unit[j].vk = "x" + this.store_unit[j].qk;
                                this.store_unit[j].qk = null;
                            }
                        }
                        for (let j = 0; j < 2; j++) {
                            // para float multdiv
                            if (this.float_mult_div_unit[j].qj === ("FAddSub" + i)) {
                                this.float_mult_div_unit[j].vj = "x" + this.float_mult_div_unit[j].qj;
                                this.float_mult_div_unit[j].qj = null;
                            }
                            if (this.float_mult_div_unit[j].qk === ("FAddSub" + i)) {
                                this.float_mult_div_unit[j].vk = "x" + this.float_mult_div_unit[j].qk;
                                this.float_mult_div_unit[j].qk = null;
                            }
                        }
                        this.registers.update_reg_prefix(instruction.i, ("FAddSub" + i));
                        this.float_add_sub_unit[i].clear();
                        return;
                    }

                }
            }
        }

    }
}

class Tomasulo {
    constructor(inst) {
        this.execution_unit = new ExeUnit();
        this.instructions = inst;
        this.instructions_w = this.instructions.length(); // guarda numero de isntrucoes que nao foram esctiras
        this.table = new InstructionTable(); // guarda todas as instrucoes, tabela que exibe onde cada 
        // table = 2 arrays, um para inst e outro para status: [inst, (...)] e [["ciclo issue", "ciclo exe", "ciclo write"], (...)] 
        this.cycle = 1;
        this.finished = false;

        for (let i = 0; i < this.instructions.length(); i++) {
            this.table.instructions.push(this.instructions.peek(i));
            this.table.status.push([]);
        }
    }
    issue(cycle) {
        /*
        Retrieve the next instruction from the head of the instruction queue. If the instruction operands are currently in the registers, then
            If a matching functional unit is available, issue the instruction.
            Else, as there is no available functional unit, stall the instruction until a station or buffer is free.
        Otherwise, we can assume the operands are not in the registers, and so use virtual values. The functional unit must calculate the real value to keep track of the functional units that produce the operand.
        */
        var next_inst = this.instructions.peek();
        if (this.execution_unit.add_to_station(next_inst, cycle)) {
            // console.log("add");
            // console.log(next_inst);
            this.table.add(next_inst, cycle);
            this.instructions.pop_front();
        }
    };
    execute(cycle) {
        // verifica se eh possivel terminar de executar a instrucao
        // quando time = 0 na reserv station, significa que terminou de executar
        // dai limpar a station e adicionar o ciclo na tabela de status
        // no final, recebe stations_finished e escreve

        /*
        If one or more of the operands is not yet available then: wait for operand to become available on the CDB.
        When all operands are available, then: if the instruction is a load or store
            Compute the effective address when the base register is available, and place it in the load/store buffer
                If the instruction is a load then: execute as soon as the memory unit is available
                Else, if the instruction is a store then: wait for the value to be stored before sending it to the memory unit
        Else, the instruction is an arithmetic logic unit (ALU) operation then: execute the instruction at the corresponding functional unit
        */

        var stations_finished = this.execution_unit.run_stations(cycle);
        for (let i = 0; i < stations_finished.length; i++) {
            // p/ cada instrucao de cá, percorrer tabela de instrucao
            // e escrever
            for (let j = 0; j < this.table.instructions.length; j++) {
                if (stations_finished[i].instruction === this.table.instructions[j]) {
                    this.table.status[j].push(cycle);
                }
            }
        }
    };
    write(cycle) {
        /*
        If the instruction was an ALU operation
            If the result is available, then: write it on the CDB and from there into the registers and any reservation stations waiting for this result
        Else, if the instruction was a store then: write the data to memory during this step
        */
        // se conseguir escrever, decrementar 1 de instructions_w
        for (let i = 0; i < this.table.instructions.length; i++) {
            if (this.table.status[i].length !== 2) {
                continue;
            }
            // se a execucao terminou no ciclo anterior, significa que devo escrever neste atual
            if (this.table.status[i][1] === (cycle - 1) && this.table.status[i][2] === undefined) {
                // this.table.instructions[i] -> a instrucao que foi escrita
                // remove_from_station acessa exe_unit e "limpa" tudo que era dependente da instrucao
                this.table.status[i].push(cycle);
                this.execution_unit.remove_from_station(this.table.instructions[i]);
                this.instructions_w--;
            }
        }
    };
    run() {
        // cada vez que aperta um botao ele chama run
        // se ainda houver instruções na fila
        // e ainda houver isntruções que não foram escritas (instructions_w > 0)
        if (!this.finished) {
            // verifica tipo da instrucao
            if (!this.instructions.empty()) {
                // se fila de isntrucoes não estiver vazia, precisa tentar dar issue 
                this.issue(this.cycle);
            }
            this.execute(this.cycle);
            this.write(this.cycle);
            if (this.instructions_w > 0) {
                this.cycle++;
            } else {
                this.finished = true;
            }
            this.execution_unit.station_status();

            this.table.update_inst_status();
            
        }
    }
}

class Queue {
    constructor(inst) {
        this.q = [];
    }

    peek(i) {
        if (i !== undefined) {
            return this.q[i];
        }
        return this.q[0];
    }

    push_back(obj) {
        this.q.push(obj);
    }

    pop_front() {
        return this.q.shift();
    }

    length() {
        return this.q.length;
    }

    empty() {
        return Array.isArray(this.q) && this.q.length === 0;
    }
}

class InstructionTable {
    constructor() {
        this.instructions = [];
        this.status = [];
    }

    add(instruction, cycle) {
        for (let i = 0; i < this.instructions.length; i++) {
            if (this.instructions[i] === instruction) {
                this.status[i].push(cycle);
                return;
            }
        }
    }

    update_inst_status() {
        for (let i = 0; i < this.instructions.length; i++) {
            if (this.status[i][0] !== undefined) {
                $(`#tomasTableS0${i}`).text(this.status[i][0]);
            }
            if (this.status[i][1] !== undefined) {
                $(`#tomasTableS1${i}`).text(this.status[i][1]);
            }
            if (this.status[i][2] !== undefined) {
                $(`#tomasTableS2${i}`).text(this.status[i][2]);
            }
        }
    }
}

/////////////// logica principal

$(document).ready(function() {

    let config = {
        "LD": null,
        "SD": null,
        "MULTD": null,
        "DIVD": null,
        "ADDD": null,
        "SUBD": null,
        "ADD": null, 
        "DADDUI": null, 
        "BEQ": null,
        "BNEZ": null
    };

    let instructions = new Queue();

    let nInst;

    let loaded = false;
    let tomasulo; // variavel da classe tomasulo

    function help() {
        a = "Dicas de uso: \nPara inserir uma intrução na unidade escolha as instruções a serem utilizadas e seus respectivos registradores, então clique em 'CONFIRMAR' para executar os dados ou 'RESET' para limpar os campos\n\nO botão 'Próximo' avançará para o proximo ciclo e o botão 'Resultado' apresenta o resultado final da execução do algoritmo";
        alert(a);
    }
        
    function read_config(data) {
        config_temp = {
            "LD": parseInt(data[0]),
            "SD": parseInt(data[1]),
            "MULTD": parseInt(data[2]),
            "DIVD": parseInt(data[3]),
            "ADDD": parseInt(data[4]),
            "SUBD": parseInt(data[5]),
            "ADD": parseInt(data[6]), 
            "DADDUI": parseInt(data[7]),
            "BEQ": parseInt(data[8]),
            "BNEZ": parseInt(data[9])
        };
        for (var key in config_temp) {
            $(`#${key}`).val(config_temp[key]);
        }
    }

    $("#fast").click(function() {
        if (!loaded) {
            alert("Carregue um exemplo ou entre com as instruções manualmente.");
            return;
        }
        if (tomasulo.finished) {
            alert("Execução está completa.");
            return;
        }
        while (!tomasulo.finished) {
            $("#clock").html("<h3>Clock: <small id='clock'>" + tomasulo.cycle + "</small></h3>");
            tomasulo.run();
        };
    })

    $("#slow").click(function() {
        if (!loaded) {
            alert("Carregue um exemplo ou entre com as instruções manualmente.");
            return;
        }
        if (tomasulo.finished) {
            alert("Execução está completa.");
            return;
        }
        $("#clock").html("<h3>Clock:" + tomasulo.cycle + "</h3>");
        tomasulo.run();
    })
    
    $("#loadEx").click(function() {
        var exN = document.getElementById("exSelect").value;
        if (parseInt(exN) === 0) {
            alert("Lembre-se de selecionar um exemplo.");
            return;
        }
        var link = "./exemplos/" + exN + ".txt";
        // var link = "https://files.catbox.moe/x27a7j.txt";
        $.get(link, function() {}).fail(function() {
            alert("Não foi possível carregar o exemplo.")
        }).done(function(data) {
            document.getElementById("instBox").value = "";
            var opcode;
            data = data.split("\n");
            read_config(data);
            for (let i = 10; i < data.length - 1; i++) {
                document.getElementById("instBox").value += data[i] + "\n";
            }
            document.getElementById("instBox").value += data[data.length - 1];
        });
    });

    $("#instReset").click(function() {
        document.getElementById("instBox").value = "";
    })

    $("#resetAll").click(function() {
        $("#exSelect").val("---");
        document.getElementById("instBox").value = "";
        loaded = false;
        instructions.q = [];

        for (var key in config) {
            $(`#${key}`).val("1");
        }
        tomasulo = null;

        $("#clock").html("");
        $("#estadoInstrucao").html("");
        $("#estadoUF").html("");
        $("#estadoMem").html("");
        $("#memoria").html("");
    })
    
    $("#loadTomasulo").click(function() {
        if (document.getElementById("instBox").value === "") {
            alert("Não há instruções escritas...");
            return;
        }
        var data = document.getElementById("instBox").value;
        var opcode;
        data = data.split("\n");
        for (var key in config) {
            config[key] = document.getElementById(key).value;
        }


        for (let i = 0; i < data.length; i++) {
            opcode = data[i].split(" ")[0];
            if(verifyInstruction(i, data[i])) {
                instructions.push_back(new Instruction(data[i], config[opcode]));
            } else {
                instructions.q = [];
                return;
            }
        }
        loaded = true;
        tomasulo = new Tomasulo(instructions);

        // atualizar página com tabelas e valores importantes para execução
        $("#clock").html("<h3>Clock: 0</h3>");
        instructionStatus();
        reservationStatus();
        registerStatus();
    });

    function instructionStatus() {
        var state = "<h3>Estado das instruções</h3>";
        state += "<table id=\"instTable\"><tr><th>Instrução</th><th>i</th><th>j</th><th>k</th><th>Issue</th><th>Exec</th><th>Write</th></tr>"; 
        for (let i = 0; i < tomasulo.instructions.length(); i++) {
            state += "<tr>" 
            state += "<td>" + tomasulo.table.instructions[i].inst + "</td>";
            if(tomasulo.table.instructions[i].i !== undefined) {
                state += "<td>" + tomasulo.table.instructions[i].i + "</td>";
            } else {
                state += "<td></td>";
            }
            if(tomasulo.table.instructions[i].j !== undefined) {
                state += "<td>" + tomasulo.table.instructions[i].j + "</td>";
            } else {
                state += "<td></td>";
            }
            if(tomasulo.table.instructions[i].k !== undefined) {
                state += "<td>" + tomasulo.table.instructions[i].k + "</td>";
            } else {
                state += "<td></td>";
            }
            state += "<td id=\"tomasTableS0" + i + "\"></td>";
            state += "<td id=\"tomasTableS1" + i + "\"></td>";
            state += "<td id=\"tomasTableS2" + i + "\"></td>";
            state += "</tr>";
        }

        state += "</table>";
        $("#estadoInstrucao").html(state);
    }

    function reservationStatus() {
        var state = "<h3>Estado das RS</h3>";
        state += "<table id=\"rsTable\"><tr><th>Tempo</th><th>RS</th><th>Busy</th><th>OP</th><th>Vj</th><th>Vk</th><th>Qj</th><th>Qk</th><tr>";
        // LU
        for (let i = 0; i < 6; i++) {
            state += "<tr>";
            state += "<td id=\"LUtime" + i + "\"></td><td>Load Unit " + i + "</td><td id=\"LUbusy" + i + "\"></td><td id=\"LUop" + i + "\"></td><td id=\"LUvj" + i + "\"></td>";
            state += "<td id=\"LUvk" + i + "\"></td><td id=\"LUqj" + i + "\"></td><td id=\"LUqk" + i + "\"></td>";
            state += "</tr>";
        }
        // SU
        for (let i = 0; i < 3; i++) {
            state += "<tr>";
            state += "<td id=\"SUtime" + i + "\"></td><td>Store Unit " + i + "</td><td id=\"SUbusy" + i + "\"></td><td id=\"SUop" + i + "\"></td><td id=\"SUvj" + i + "\"></td>";
            state += "<td id=\"SUvk" + i + "\"></td><td id=\"SUqj" + i + "\"></td><td id=\"SUqk" + i + "\"></td>";
            state += "</tr>";
        }
        // IADD
        for (let i = 0; i < 3; i++) {
            state += "<tr>";
            state += "<td id=\"IADDtime" + i + "\"></td><td>Integer Unit " + i + "</td><td id=\"IADDbusy" + i + "\"></td><td id=\"IADDop" + i + "\"></td><td id=\"IADDvj" + i + "\"></td>";
            state += "<td id=\"IADDvk" + i + "\"></td><td id=\"IADDqj" + i + "\"></td><td id=\"IADDqk" + i + "\"></td>";
            state += "</tr>";
        }
        // FADD
        for (let i = 0; i < 3; i++) {
            state += "<tr>";
            state += "<td id=\"FADDtime" + i + "\"></td><td>FAddSub Unit " + i + "</td><td id=\"FADDbusy" + i + "\"></td><td id=\"FADDop" + i + "\"></td><td id=\"FADDvj" + i + "\"></td>";
            state += "<td id=\"FADDvk" + i + "\"></td><td id=\"FADDqj" + i + "\"></td><td id=\"FADDqk" + i + "\"></td>";
            state += "</tr>";
        }
        // MD
        for (let i = 0; i < 2; i++) {
            state += "<tr>";
            state += "<td id=\"MDtime" + i + "\"></td><td>MultDiv Unit " + i + "</td><td id=\"MDbusy" + i + "\"></td><td id=\"MDop" + i + "\"></td><td id=\"MDvj" + i + "\"></td>";
            state += "<td id=\"MDvk" + i + "\"></td><td id=\"MDqj" + i + "\"></td><td id=\"MDqk" + i + "\"></td>";
            state += "</tr>";
        }
        state += "</table>";
        state += "<h7>Detalhe: Quando houver um x na frente da station,<br>significa que o valor está pronto.</h7>"
        $("#estadoUF").html(state);
    }

    function registerStatus() {
        var state = "<h3>Estado dos registradores</h3>";
        state += "<table id=\"regTable\">";
        state += "<tr>";
        for (var i = 0; i < 8; i++) {
            state += "<th>F" + (i * 2) + "</th>";
        }
        state += "</tr><tr>";
        for (var i = 0; i < 8; i++) {
            state += "<td id=\"F" + (i * 2) + "\">&nbsp;</th>";
        }
        state += "</tr>";
        for (var i = 0; i < 8; i++) {
            state += "<th>R" + i + "</th>";
        }
        state += "</tr><tr>";
        for (var i = 0; i < 8; i++) {
            state += "<td id=\"R" + i + "\">&nbsp;</th>";
        }
        state += "</tr>";

        state += "</table><br>";
        $("#memoria").html(state);
    }


    function verifyInstruction(linha, inst) {
        var instPossiveis = ["LD", "SD", "BNEZ", "BEQ", "ADD", "ADDD", "DADDUI", "SUBD", "MULTD", "DIVD"];
        var inst = inst.split(" ");
        var opcode = inst[0];
        var data = inst[1];
        var error = "";
        if (instPossiveis.includes(opcode)) {
            if (opcode === "BEQ") {
                var regex = /^R[0-7],R[0-7],[a-zA-Z]{1,5}$/;
                var regexB = /^R[0-7],[a-zA-Z]{1,5}$/;
                if (regexB.test(data)) {
                    error += "Na instrução BEQ da linha " + (linha + 1) + " você está usando 1 registrador, ao invés de dois. Verifique se a instrução desejada realmente é BEQ, e não BNEZ.";
                    error += "\n\nExemplo de como deve ficar: BEQ R1,R2,LOOP";
                    alert(error);
                    return false;
                }
                if (regex.test(data)) {
                    return true;
                } else {
                    error += "A instrução BEQ na linha " + (linha + 1) + " está escrita de forma incorreta.\n\n";
                    error += "Certifique-se de que tudo está separado por vírgulas e que não há espaços após as vírgulas, que está usando os registradores corretos (o primeiro registrador é do tipo R, o segundo é do tipo R) e/ou que os números dos registradores são válidos (R0 até R7).";
                    error += "\nAlém disso, verifique se está colocando o rótulo do branch na terceira entrada.";
                    error += "\n\nExemplo de como deve ficar: BEQ R1,R2,LOOP";
                    alert(error);
                    return false;
                }
            }
            if (opcode === "BNEZ") {
                var regex = /^R[0-7],[a-zA-Z]{1,5}$/;
                var regexB = /^R[0-7],R[0-7],[a-zA-Z]{1,5}$/;
                if (regexB.test(data)) {
                    error += "Na instrução BNEZ da linha " + (linha + 1) + " você está usando 2 registradores, ao invés de um. Verifique se a instrução desejada realmente é BNEZ, e não BEQ.";
                    error += "\n\nExemplo de como deve ficar: BNEZ R2,LOOP";
                    alert(error);
                    return false;
                }
                if (regex.test(data)) {
                    return true;
                } else {
                    error += "A instrução BNEZ na linha " + (linha + 1) + " está escrita de forma incorreta.\n\n";
                    error += "Certifique-se de que tudo está separado por vírgulas e que não há espaços após as vírgulas, que está usando os registradores corretos (do tipo R) e/ou que os números dos registradores são válidos (R0 até R7).";
                    error += "\nAlém disso, verifique se está colocando o rótulo do branch na segunda entrada.";
                    error += "\n\nExemplo de como deve ficar: BNEZ R2,LOOP";
                    alert(error);
                    return false;
                }
            }
            if (opcode === "LD") {
                var regex = /^F(0|2|4|6|8|10|12|14),[0-9]+\(R[0-7]\)$/;
                if (regex.test(data)) {
                    return true;
                } else {
                    error += "A instrução LD na linha " + (linha + 1) + " está escrita de forma incorreta.\n\n";
                    error += "Certifique-se de que tudo está separado por vírgulas e que não há espaços após as vírgulas, que todos estão separados por vírgulas, que está usando os registradores corretos (o primeiro registrador é do tipo F, o segundo é do tipo R) e/ou que os números dos registradores são válidos (F0 até F14, apenas pares, R0 até R7).";
                    error += "\nAlém disso, verifique se está colocando um valor de offset.";
                    error += "\n\nExemplo de como deve ficar: LD F2,14(R2)";
                    alert(error);
                    return false;
                }
            }
            if (opcode === "SD") {
                var regex = /^F(0|2|4|6|8|10|12|14),[0-9]+\(R[0-7]\)$/;
                if (regex.test(data)) {
                    return true;
                } else {
                    error += "A instrução SD na linha " + (linha + 1) + " está escrita de forma incorreta.\n\n";
                    error += "Certifique-se de que tudo está separado por vírgulas e que não há espaços após as vírgulas, que todos estão separados por vírgulas, que está usando os registradores corretos (o primeiro registrador é do tipo F, o segundo é do tipo R) e/ou que os números dos registradores são válidos (F0 até F14, apenas pares, R0 até R7).";
                    error += "\nAlém disso, verifique se está colocando um valor de offset.";
                    error += "\n\nExemplo de como deve ficar: SD F2,14(R2)";
                    alert(error);
                    return false;
                }
            }
            if (opcode === "ADD") {
                var regex = /^R[0-7],R[0-7],R[0-7]$/;
                var regexF = /^F(0|2|4|6|8|10|12|14),F(0|2|4|6|8|10|12|14),F(0|2|4|6|8|10|12|14)$/;
                if (regexF.test(data)) {
                    error += "Na instrução ADD da linha " + (linha + 1) + " você está usando apenas registradores de ponto flutuante. Verifique se realmente quer usar ADD, ou se faltou um D (ADDD).";
                    alert(error);
                    return false;
                }

                if (regex.test(data)) {
                    return true;
                } else {
                    error += "A instrução ADD na linha " + (linha + 1) + " está escrita de forma incorreta.\n\n";
                    error += "Certifique-se de que tudo está separado por vírgulas e que não há espaços após as vírgulas, que todos estão separados por vírgulas, que está usando os registradores corretos (apenas registradores que começam com R) e/ou que os números dos registradores são válidos (R0 até R7)";
                    error += "\n\nExemplo de como deve ficar: ADD R1,R2,R3";
                    alert(error);
                    return false;
                }
            }
            if (opcode === "DADDUI") {
                var regex = /^R[0-7],R[0-7],[0-9]+$/;
                if (regex.test(data)) {
                    return true;
                } else {
                    error += "A instrução DADDUI na linha " + (linha + 1) + " está escrita de forma incorreta.\n\n";
                    error += "Certifique-se de que tudo está separado por vírgulas e que não há espaços após as vírgulas, que todos estão separados por vírgulas, que está usando os registradores corretos (apenas registradores que começam com R) e/ou que os números dos registradores são válidos (R0 até R7) e que o último componente é um inteiro.";
                    error += "\n\nExemplo de como deve ficar: DADDUI R1,R2,10";
                    alert(error);
                    return false;
                }
            }
            if (opcode === "MULTD") {
                var regex = /^F(0|2|4|6|8|10|12|14),F(0|2|4|6|8|10|12|14),F(0|2|4|6|8|10|12|14)$/;
                if (regex.test(data)) {
                    return true;
                } else {
                    error += "A instrução MULTD na linha " + (linha + 1) + " está escrita de forma incorreta.\n\n";
                    error += "Certifique-se de que tudo está separado por vírgulas e que não há espaços após as vírgulas, que todos estão separados por vírgulas, que está usando os registradores corretos (apenas registradores que começam com F) e/ou que os números dos registradores são válidos (F0 até F14, apenas pares).";
                    error += "\n\nExemplo de como deve ficar: MULTD F2,F0,F14";
                    alert(error);
                    return false;
                }   
            }
            if (opcode === "DIVD") {
                var regex = /^F(0|2|4|6|8|10|12|14),F(0|2|4|6|8|10|12|14),F(0|2|4|6|8|10|12|14)$/;
                if (regex.test(data)) {
                    return true;
                } else {
                    error += "A instrução DIVD na linha " + (linha + 1) + " está escrita de forma incorreta.\n\n";
                    error += "Certifique-se de que tudo está separado por vírgulas e que não há espaços após as vírgulas, que todos estão separados por vírgulas, que está usando os registradores corretos (apenas registradores que começam com F) e/ou que os números dos registradores são válidos (F0 até F14, apenas pares).";
                    error += "\n\nExemplo de como deve ficar: DIVD F2,F0,F14";
                    alert(error);
                    return false;
                }
            }
            if (opcode === "SUBD") {
                var regex = /^F(0|2|4|6|8|10|12|14),F(0|2|4|6|8|10|12|14),F(0|2|4|6|8|10|12|14)$/;
                if (regex.test(data)) {
                    return true;
                } else {
                    error += "A instrução DIVD na linha " + (linha + 1) + " está escrita de forma incorreta.\n\n";
                    error += "Certifique-se de que tudo está separado por vírgulas e que não há espaços após as vírgulas, que todos estão separados por vírgulas, que está usando os registradores corretos (apenas registradores que começam com F) e/ou que os números dos registradores são válidos (F0 até F14, apenas pares).";
                    error += "\n\nExemplo de como deve ficar: SUBD F2,F0,F14";
                    alert(error);
                    return false;
                }
            }
            if (opcode === "ADDD") {
                var regex = /^F(0|2|4|6|8|10|12|14),F(0|2|4|6|8|10|12|14),F(0|2|4|6|8|10|12|14)$/;
                var regexADD = /^R[0-7],R[0-7],R[0-7]$/;
                if (regexADD.test(data)) {
                    error += "Na instrução ADDD da linha " + (linha + 1) + " você está usando apenas registradores de inteiros. Verifique se realmente quer usar ADDD, ou se há um D a mais (ADD).";
                    alert(error);
                    return false;
                }
                if (regex.test(data)) {
                    return true;
                } else {
                    error += "A instrução ADDD na linha " + (linha + 1) + " está escrita de forma incorreta.\n\n";
                    error += "Certifique-se de que tudo está separado por vírgulas e que não há espaços após as vírgulas, que todos estão separados por vírgulas, que está usando os registradores corretos (apenas registradores que começam com F) e/ou que os números dos registradores são válidos (F0 até F14, apenas pares).";
                    error += "\n\nExemplo de como deve ficar: ADDD F2,F0,F14";
                    alert(error);
                    return false;
                }
            }
        } else {
            error += "A instrução na linha " + (linha + 1) + " é inválida. As instruções permitidas são: LD, SD, BNEZ, BEQ, ADD, ADDD, DADDUI, SUBD, MULTD, DIVD";
            alert(error);
            return false;
        }
    }

});
